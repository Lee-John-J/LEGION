const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { supabase } = require('../db/supabase')
const { requireAuth } = require('../middleware/auth')
const { getAccountByRiotId, getMatchIdsPaginated, getMatch } = require('../services/riot')
const { computeCellStats, isRemake, getSameTeamCellGroup } = require('../services/stats')
const { currentSeasonStart, currentSeasonStartEpoch, currentSeasonYear } = require('../services/season')

// ── Limits (named once so the numbers are explained once) ────────
const CELL_CAPACITY = 10               // operators per cell (see CLAUDE.md)
const MAX_MATCH_IDS_PER_OPERATOR = 500 // Riot match-id pages walked per operator per sync
const INGEST_BATCH_LIMIT = 40          // match payloads fetched per sync (one Riot call each)
const INGEST_TIME_BUDGET_MS = 45_000   // stop early; Vercel kills the function at 60 s
const EXISTENCE_CHUNK = 500            // ids per "already stored?" query (PostgREST caps rows at 1000)

// ── Helper: reject malformed UUID path params up front ───────────
// A garbage id would otherwise cost a DB round trip and come back as a
// misleading 403/404 instead of a 400.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function requireUuidParams(...names) {
  return (req, res, next) => {
    for (const name of names) {
      if (!UUID_RE.test(req.params[name] ?? '')) {
        return res.status(400).json({ error: 'MALFORMED IDENTIFIER' })
      }
    }
    next()
  }
}

// ── Helper: generate LGN-XXXX-XXXX invite code ─────────────────

function generateInviteCode() {
  // crypto.randomInt, not Math.random: invite codes are bearer credentials,
  // so they must not come from a predictable PRNG.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const pick = () => chars[crypto.randomInt(chars.length)]
  let code = 'LGN-'
  for (let i = 0; i < 4; i++) code += pick()
  code += '-'
  for (let i = 0; i < 4; i++) code += pick()
  return code
}

// ── Helper: per-user throttle for invite-code join attempts ─────
// In-memory and per-serverless-instance: bounds guessing bursts rather than
// providing a global guarantee, which is proportionate for a 32^8 keyspace.
const joinAttempts = new Map() // userId -> { count, windowStart }
const JOIN_WINDOW_MS = 60_000
const JOIN_MAX_PER_WINDOW = 10

function allowJoinAttempt(userId) {
  const now = Date.now()
  const entry = joinAttempts.get(userId)
  if (!entry || now - entry.windowStart > JOIN_WINDOW_MS) {
    if (joinAttempts.size > 5000) joinAttempts.clear() // bound memory
    joinAttempts.set(userId, { count: 1, windowStart: now })
    return true
  }
  entry.count++
  return entry.count <= JOIN_MAX_PER_WINDOW
}

// ── Helper: verify user is a member of the cell ─────────────────
async function requireCellMembership(sb, cellId, userId) {
  const { data, error } = await sb
    .from('cell_members')
    .select('id')
    .eq('cell_id', cellId)
    .eq('user_id', userId)
    .maybeSingle()
  // A DB fault must not read as "not a member": throw so the error
  // middleware answers 500 instead of denying a legitimate operator.
  if (error) throw new Error(`[LEGION] Membership check failed: ${error.message}`)
  return !!data
}

// ── Helper: get cell member PUUIDs ───────────────────────────────

async function getCellPuuids(sb, cellId) {
  const { data: memberRows, error: memberError } = await sb
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', cellId)
  // Propagate DB faults: an empty roster here would otherwise render as a
  // 200 "no linked operators" Briefing for the duration of an outage.
  if (memberError) throw new Error(`[LEGION] Roster query failed: ${memberError.message}`)

  const userIds = (memberRows ?? []).map((r) => r.user_id)
  if (userIds.length === 0) return []

  const { data: opRows, error: opError } = await sb
    .from('operators')
    .select('user_id, puuid, riot_game_name, riot_tag_line')
    .in('user_id', userIds)
  if (opError) throw new Error(`[LEGION] Operator query failed: ${opError.message}`)

  const members = (opRows ?? [])
    .map((r) => ({ id: r.user_id, puuid: r.puuid, riot_game_name: r.riot_game_name, riot_tag_line: r.riot_tag_line }))
    .filter((m) => m.puuid)

  return members
}

// ── Helper: fetch matches from DB that overlap with any of these PUUIDs ──
// Filters to the current season via the match's gameStartTimestamp (epoch
// millis inside the raw JSONB) and walks past PostgREST's silent 1000-row
// response cap with a KEYSET cursor on match_id. Offset paging ordered by a
// non-unique column could repeat or skip rows whenever an ingest landed
// between two pages — double-counting games in every stat.

async function getStoredMatches(sb, puuids) {
  const seasonStartMs = currentSeasonStart().getTime()
  const PAGE = 1000
  const rows = []
  let after = '' // every match_id sorts after the empty string
  for (;;) {
    const { data, error } = await sb
      .from('matches')
      .select('match_id, match_data')
      .overlaps('participants_puuids', puuids)
      .gte('match_data->info->gameStartTimestamp', seasonStartMs)
      .gt('match_id', after)
      .order('match_id', { ascending: true })
      .limit(PAGE)

    // Surface the fault rather than computing a season on a truncated set
    // and returning it as a 200.
    if (error) throw new Error(`[LEGION] Match query failed: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
    after = data[data.length - 1].match_id
  }
  return rows
}

// ═════════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════════

// GET /api/cells — list cells for authenticated user
router.get('/', requireAuth, async (req, res) => {
  const sb = supabase
  const { data, error } = await sb
    .from('cell_members')
    .select('cell_id, cells(id, name, invite_code, created_at, created_by)')
    .eq('user_id', req.user.id)

  if (error) {
    console.error('[LEGION] DB error listing cells:', error.message)
    return res.status(500).json({ error: 'DATABASE ERROR' })
  }

  // Get member counts in a single query instead of one per cell (N+1 fix)
  const cellIds = (data ?? []).map((row) => row.cells?.id).filter(Boolean)
  let countMap = {}
  if (cellIds.length > 0) {
    const { data: countRows } = await sb
      .from('cell_members')
      .select('cell_id')
      .in('cell_id', cellIds)
    // Count occurrences per cell_id
    countMap = (countRows ?? []).reduce((acc, row) => {
      acc[row.cell_id] = (acc[row.cell_id] || 0) + 1
      return acc
    }, {})
  }

  // Resolve handler names from operators table
  const handlerIds = [...new Set((data ?? []).map((row) => row.cells?.created_by).filter(Boolean))]
  let handlerMap = {}
  if (handlerIds.length > 0) {
    const { data: handlerRows } = await sb
      .from('operators')
      .select('user_id, riot_game_name')
      .in('user_id', handlerIds)
    handlerMap = (handlerRows ?? []).reduce((acc, row) => {
      acc[row.user_id] = row.riot_game_name || 'UNKNOWN'
      return acc
    }, {})
  }

  const cells = (data ?? []).map((row) => ({
    ...row.cells,
    member_count: countMap[row.cells?.id] || 0,
    handler_name: handlerMap[row.cells?.created_by] || 'UNKNOWN',
  }))

  res.json(cells)
})

// POST /api/cells — create a new cell
router.post('/', requireAuth, async (req, res) => {
  const sb = supabase
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) return res.status(400).json({ error: 'CELL DESIGNATION REQUIRED' })
  if (name.length > 64) {
    return res.status(400).json({ error: 'CELL DESIGNATION EXCEEDS 64 CHARACTERS' })
  }

  const invite_code = generateInviteCode()

  const { data: cell, error: cellError } = await sb
    .from('cells')
    .insert({ name, created_by: req.user.id, invite_code })
    .select()
    .single()

  if (cellError) {
    console.error('[LEGION] DB error creating cell:', cellError.message)
    return res.status(500).json({ error: 'DATABASE ERROR' })
  }

  // Auto-add creator as member — if this fails the creator can't even see
  // their own cell (GET /:id checks membership), so roll the cell back
  // rather than orphan it.
  const { error: memberError } = await sb
    .from('cell_members')
    .insert({ cell_id: cell.id, user_id: req.user.id })

  if (memberError) {
    console.error('[LEGION] DB error adding creator membership:', memberError.message)
    await sb.from('cells').delete().eq('id', cell.id)
    return res.status(500).json({ error: 'DATABASE ERROR' })
  }

  res.json({ ...cell, member_count: 1 })
})

// GET /api/cells/:id — get cell with members
router.get('/:id', requireAuth, requireUuidParams('id'), async (req, res) => {
  const sb = supabase
  if (!(await requireCellMembership(sb, req.params.id, req.user.id))) {
    return res.status(403).json({ error: 'ACCESS DENIED — NOT A MEMBER OF THIS CELL' })
  }
  const { data: cell, error } = await sb
    .from('cells')
    .select('id, name, created_at')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'CELL NOT FOUND' })

  const { data: memberRows } = await sb
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', req.params.id)

  const userIds = (memberRows ?? []).map((r) => r.user_id)

  const { data: opRows } = userIds.length > 0
    ? await sb.from('operators').select('user_id, riot_game_name, riot_tag_line, puuid, is_verified').in('user_id', userIds)
    : { data: [] }

  const members = (memberRows ?? []).map((row) => {
    const op = (opRows ?? []).find((o) => o.user_id === row.user_id)
    return { id: row.user_id, ...op }
  })

  res.json({ ...cell, members, member_count: members.length })
})

// POST /api/cells/join-by-code — look up cell by invite code and join
// Service role client bypasses RLS, so we query tables directly.
router.post('/join-by-code', requireAuth, async (req, res) => {
  const { invite_code } = req.body ?? {}
  if (!invite_code) return res.status(400).json({ error: 'INVITE CODE REQUIRED' })

  // Invite codes are bearer credentials — cap guess attempts per user.
  if (!allowJoinAttempt(req.user.id)) {
    return res.status(429).json({ error: 'TOO MANY INTAKE ATTEMPTS. STAND BY, THEN RE-SUBMIT.' })
  }

  const code = String(invite_code).trim().toUpperCase()
  if (!/^LGN-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    // Same message as an unknown code so the response doesn't distinguish
    // "badly formatted" from "not found".
    return res.status(404).json({ error: 'INVITE CODE INVALID OR EXPIRED' })
  }

  const sb = supabase

  // Look up cell by invite code
  const { data: cell, error: cellError } = await sb
    .from('cells')
    .select('id, name')
    .eq('invite_code', code)
    .single()

  if (cellError || !cell) {
    return res.status(404).json({ error: 'INVITE CODE INVALID OR EXPIRED' })
  }

  // Check if already a member
  const { data: existing } = await sb
    .from('cell_members')
    .select('id')
    .eq('cell_id', cell.id)
    .eq('user_id', req.user.id)
    .single()

  if (existing) {
    return res.status(400).json({ error: 'OPERATOR ALREADY ENLISTED IN CELL' })
  }

  // Check capacity
  const { count } = await sb
    .from('cell_members')
    .select('*', { count: 'exact', head: true })
    .eq('cell_id', cell.id)

  if (count >= CELL_CAPACITY) {
    return res.status(400).json({ error: 'CELL AT MAXIMUM CAPACITY' })
  }

  // Add member
  const { error: insertError } = await sb
    .from('cell_members')
    .insert({ cell_id: cell.id, user_id: req.user.id })

  if (insertError) {
    console.error('[LEGION] DB error joining cell:', insertError.message)
    return res.status(500).json({ error: 'DATABASE ERROR' })
  }

  res.json({ cell_id: cell.id, cell_name: cell.name, status: 'OPERATOR ADDED TO CELL' })
})

// NOTE: Direct join-by-ID route removed — all joins must go through
// POST /api/cells/join-by-code with a valid invite code. This prevents
// unauthorized users from joining cells by guessing UUIDs.

// DELETE /api/cells/:id/members/:userId — remove an operator (handler only)
router.delete('/:id/members/:userId', requireAuth, requireUuidParams('id', 'userId'), async (req, res) => {
  const sb = supabase
  const { data: cell, error: lookupError } = await sb
    .from('cells')
    .select('id, created_by')
    .eq('id', req.params.id)
    .single()

  if (lookupError || !cell) {
    return res.status(404).json({ error: 'CELL NOT FOUND' })
  }

  if (cell.created_by !== req.user.id) {
    return res.status(403).json({ error: 'ONLY THE HANDLER MAY REMOVE OPERATORS' })
  }

  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'HANDLER CANNOT SELF-REMOVE. DISSOLVE THE CELL INSTEAD.' })
  }

  const { data: membership } = await sb
    .from('cell_members')
    .select('id')
    .eq('cell_id', req.params.id)
    .eq('user_id', req.params.userId)
    .single()

  if (!membership) {
    return res.status(404).json({ error: 'OPERATOR NOT FOUND IN THIS CELL' })
  }

  const { error } = await sb
    .from('cell_members')
    .delete()
    .eq('cell_id', req.params.id)
    .eq('user_id', req.params.userId)

  if (error) {
    console.error('[LEGION] DB error removing operator:', error.message)
    return res.status(500).json({ error: 'DATABASE ERROR' })
  }
  res.json({ status: 'OPERATOR REMOVED FROM CELL' })
})

// DELETE /api/cells/:id — dissolve a cell (handler only)
router.delete('/:id', requireAuth, requireUuidParams('id'), async (req, res) => {
  const sb = supabase
  const { data: cell, error: lookupError } = await sb
    .from('cells')
    .select('id, created_by')
    .eq('id', req.params.id)
    .single()

  if (lookupError || !cell) {
    return res.status(404).json({ error: 'CELL NOT FOUND' })
  }

  if (cell.created_by !== req.user.id) {
    return res.status(403).json({ error: 'ONLY THE HANDLER MAY DISSOLVE A CELL' })
  }

  await sb.from('cell_members').delete().eq('cell_id', cell.id)
  const { error } = await sb.from('cells').delete().eq('id', cell.id)

  if (error) {
    console.error('[LEGION] DB error dissolving cell:', error.message)
    return res.status(500).json({ error: 'DATABASE ERROR' })
  }
  res.json({ status: 'CELL DISSOLVED' })
})

// ═════════════════════════════════════════════════════════════════
// POST /api/cells/:id/ingest — pull match data from Riot API
//
// This is the "sync" button. It:
//   1. Gets every cell member's PUUID
//   2. Fetches their recent match IDs from Riot
//   3. Skips matches already in the database
//   4. Fetches and stores new match details (one at a time,
//      respecting the rate limiter in riot.js)
//   5. Returns a summary of what was fetched
// ═════════════════════════════════════════════════════════════════

router.post('/:id/ingest', requireAuth, requireUuidParams('id'), async (req, res) => {
  const sb = supabase
  const started = Date.now()
  if (!(await requireCellMembership(sb, req.params.id, req.user.id))) {
    return res.status(403).json({ error: 'ACCESS DENIED — NOT A MEMBER OF THIS CELL' })
  }

  // Attempt to link any cell members who have no operators entry yet
  const { data: allMemberRows } = await sb
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', req.params.id)
  const allUserIds = (allMemberRows ?? []).map((r) => r.user_id)

  if (allUserIds.length > 0) {
    const { data: existingOps } = await sb
      .from('operators')
      .select('user_id')
      .in('user_id', allUserIds)
    const linkedUserIds = new Set((existingOps ?? []).map((o) => o.user_id))
    const unlinkedUserIds = allUserIds.filter((id) => !linkedUserIds.has(id))

    for (const userId of unlinkedUserIds) {
      try {
        const { data: { user: authUser } } = await sb.auth.admin.getUserById(userId)
        const name = authUser?.user_metadata?.riot_game_name
        const tag = authUser?.user_metadata?.riot_tag_line
        if (!name || !tag) continue

        const account = await getAccountByRiotId(name, tag)
        const { error: linkError } = await sb.from('operators').upsert({
          user_id: userId,
          puuid: account.puuid,
          riot_game_name: account.gameName,
          riot_tag_line: account.tagLine,
          is_verified: true,
        }, { onConflict: 'user_id' })
        // The puuid unique constraint rejects a Riot ID already claimed by
        // another operator — the same case /link answers with a 409.
        if (linkError) throw new Error(linkError.message)
        console.log(`[LEGION] Auto-linked unlinked operator: ${name}#${tag}`)
      } catch (err) {
        console.warn(`[LEGION] Failed to auto-link operator ${userId}: ${err.message}`)
      }
    }
  }

  const members = await getCellPuuids(sb, req.params.id)
  const puuids = members.map((m) => m.puuid)

  if (puuids.length === 0) {
    return res.json({
      status: 'NO_LINKED_OPERATORS',
      message: 'No operators with linked Riot IDs found in this cell.',
      fetched: 0,
      skipped: 0,
    })
  }

  const seasonStart = currentSeasonStartEpoch()
  const allMatchIds = new Set()
  for (const puuid of puuids) {
    try {
      const ids = await getMatchIdsPaginated(puuid, { maxMatches: MAX_MATCH_IDS_PER_OPERATOR, startTime: seasonStart })
      ids.forEach((id) => allMatchIds.add(id))
    } catch (err) {
      console.warn(`[LEGION] Failed to get match IDs for ${puuid}: ${err.message}`)
    }
  }

  if (allMatchIds.size === 0) {
    return res.json({ status: 'NO_MATCHES_FOUND', fetched: 0, skipped: 0 })
  }

  // "Already stored?" in chunks: one .in() with thousands of ids would be
  // silently capped at PostgREST's 1000-row limit (and could overflow the
  // URL), making every id past the cap look new on every sync — burning
  // Riot quota on re-fetches and never reaching "INGEST COMPLETE".
  const idList = Array.from(allMatchIds)
  const existingIds = new Set()
  for (let i = 0; i < idList.length; i += EXISTENCE_CHUNK) {
    const { data: existingRows, error } = await sb
      .from('matches')
      .select('match_id')
      .in('match_id', idList.slice(i, i + EXISTENCE_CHUNK))
    if (error) throw new Error(`[LEGION] Match existence query failed: ${error.message}`)
    for (const r of existingRows ?? []) existingIds.add(r.match_id)
  }
  const newMatchIds = idList.filter((id) => !existingIds.has(id))

  // Fetch details in batches that fit within Vercel's timeout — each match
  // detail is one Riot API call — and stop early when the time budget runs
  // out, so the caller always gets a summary instead of a platform 504.
  const batch = newMatchIds.slice(0, INGEST_BATCH_LIMIT)

  let fetched = 0
  for (const matchId of batch) {
    if (Date.now() - started > INGEST_TIME_BUDGET_MS) {
      console.warn('[LEGION] Ingest time budget reached — deferring the rest to the next sync')
      break
    }
    try {
      const matchData = await getMatch(matchId)
      const participantPuuids = matchData.metadata?.participants ?? []

      await sb.from('matches').upsert(
        {
          match_id: matchId,
          match_data: matchData,
          participants_puuids: participantPuuids,
        },
        { onConflict: 'match_id' }
      )

      fetched++
    } catch (err) {
      console.warn(`[LEGION] Failed to fetch match ${matchId}: ${err.message}`)
    }
  }

  // Everything not yet on file — deferred, failed, or beyond this batch —
  // is "pending"; the client prompts for another sync while it is > 0.
  const remaining = newMatchIds.length - fetched

  res.json({
    status: remaining > 0 ? 'INGEST_PARTIAL' : 'INGEST_COMPLETE',
    total_discovered: allMatchIds.size,
    skipped: existingIds.size,
    fetched,
    remaining,
    fetch_window_start: new Date(seasonStart * 1000).toISOString(),
    message: remaining > 0
      ? `${remaining} matches pending. Sync again to continue filing.`
      : undefined,
  })
})

// ═════════════════════════════════════════════════════════════════
// GET /api/cells/:id/stats — compute group statistics from DB
//
// Reads cached match data only — no Riot API calls.
// Run /ingest first to populate the cache.
// ═════════════════════════════════════════════════════════════════

router.get('/:id/stats', requireAuth, requireUuidParams('id'), async (req, res) => {
  const sb = supabase
  if (!(await requireCellMembership(sb, req.params.id, req.user.id))) {
    return res.status(403).json({ error: 'ACCESS DENIED — NOT A MEMBER OF THIS CELL' })
  }
  const members = await getCellPuuids(sb, req.params.id)
  const puuids = members.map((m) => m.puuid)

  // Full roster includes members without PUUIDs (unlinked Riot accounts)
  const { data: allMemberRows } = await sb
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', req.params.id)
  const allUserIds = (allMemberRows ?? []).map((r) => r.user_id)
  const { data: allOpRows } = allUserIds.length > 0
    ? await sb.from('operators').select('user_id, puuid, riot_game_name, riot_tag_line').in('user_id', allUserIds)
    : { data: [] }
  const fullRoster = (allMemberRows ?? []).map((row) => {
    const op = (allOpRows ?? []).find((o) => o.user_id === row.user_id)
    return { id: row.user_id, puuid: op?.puuid ?? null, riot_game_name: op?.riot_game_name ?? null }
  })

  if (puuids.length === 0) {
    return res.json({
      total_games: 0,
      games_together: 0,
      games_apart: 0,
      win_rate_together: null,
      win_rate_apart: null,
      champion_synergies: [],
      game_mode_breakdown: [],
      operator_stats: fullRoster.map((m) => ({
        puuid: m.puuid,
        user_id: m.id,
        name: m.riot_game_name ?? 'UNKNOWN',
        games: 0, wins: 0, win_rate: null, wr_without: null,
        top_champions: [], unique_champions: 0,
      })),
    })
  }

  const matchRows = await getStoredMatches(sb, puuids)
  const matches = matchRows.map((r) => r.match_data)
  const stats = computeCellStats(matches, puuids, fullRoster)
  stats.season_year = currentSeasonYear()

  // Deliberately NO cross-cell data here: an earlier "adjacent cells" block
  // returned other cells' ids, names, and rosters to people who were not
  // members of them, and nothing in the UI ever rendered it.
  res.json(stats)
})

// ═════════════════════════════════════════════════════════════════
// GET /api/cells/:id/operations — joint operation log
//
// Returns matches where 2+ cell members played together,
// formatted for the Operation Log page.
// ═════════════════════════════════════════════════════════════════

router.get('/:id/operations', requireAuth, requireUuidParams('id'), async (req, res) => {
  const sb = supabase
  if (!(await requireCellMembership(sb, req.params.id, req.user.id))) {
    return res.status(403).json({ error: 'ACCESS DENIED — NOT A MEMBER OF THIS CELL' })
  }
  const members = await getCellPuuids(sb, req.params.id)
  const puuids = members.map((m) => m.puuid)

  if (puuids.length === 0) return res.json([])

  const matchRows = await getStoredMatches(sb, puuids)

  const puuidSet = new Set(puuids)

  const operations = []
  for (const row of matchRows) {
    const match = row.match_data
    // Skip remakes here too so the Operation Log (and its summary strip)
    // agrees with the Briefing's stats engine, which also excludes them.
    if (isRemake(match)) continue
    const participants = match.info?.participants ?? []
    // Same joint-deployment rule as the stats engine (same team, or the same
    // Arena subteam), so the log and the Briefing can never disagree.
    const cellParticipants = getSameTeamCellGroup(participants, puuidSet)
    if (!cellParticipants) continue
    const isArena = participants.some((p) => (p.playerSubteamId ?? 0) > 0)

    operations.push({
      match_id: row.match_id,
      game_mode: match.info?.gameMode,
      queue_id: match.info?.queueId,
      game_duration: match.info?.gameDuration,
      game_end_timestamp: match.info?.gameEndTimestamp,
      cell_members: cellParticipants.map((p) => {
        const m = members.find((m) => m.puuid === p.puuid)
        return m?.riot_game_name ?? p.riotIdGameName ?? 'UNKNOWN'
      }),
      cell_members_won: cellParticipants[0].win,
      // Arena final standing (1-8) — placement is per-subteam, so any member's value works
      placement: isArena ? (cellParticipants[0].placement ?? cellParticipants[0].subteamPlacement ?? null) : null,
      participants: cellParticipants.map((p) => {
        const member = members.find((m) => m.puuid === p.puuid)
        return {
          // user_id lets the client mark the viewer by identity rather than
          // by display name (Riot names change; ids never do)
          user_id: member?.id ?? null,
          name: member?.riot_game_name ?? p.riotIdGameName,
          champion: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          damage: p.totalDamageDealtToChampions,
          gold: p.goldEarned,
          win: p.win,
          // Assigned lane (TOP/JUNGLE/MIDDLE/BOTTOM/UTILITY) — empty for ARAM/Arena
          role: p.teamPosition || null,
        }
      }),
    })
  }

  // Sort by game end time, newest first
  operations.sort((a, b) => (b.game_end_timestamp ?? 0) - (a.game_end_timestamp ?? 0))

  res.json(operations)
})

module.exports = router
