/**
 * Stats-engine coverage beyond the 2026-08-19 audit set: the payload fields
 * the Briefing renders directly (timeline, duo links, WR-without, mode
 * breakdown, heatmap, recent form, synergies, assessments).
 */
const test = require('node:test')
const assert = require('node:assert/strict')

const { computeCellStats, isRemake } = require('./stats')
const { participant, match } = require('./test-helpers')

const HOUR = 3_600_000
const T0 = Date.UTC(2026, 5, 10, 20, 0, 0) // Wed 2026-06-10 20:00Z

// Two cell members (a, b) on team 100 against two strangers on 200
function jointGame({ win, endTs, queueId = 420, gameMode = 'CLASSIC', champs = ['Ashe', 'Lulu'] }) {
  return match({
    queueId, gameMode, endTs,
    participants: [
      participant('a', { teamId: 100, win, championName: champs[0] }),
      participant('b', { teamId: 100, win, championName: champs[1] }),
      participant('x', { teamId: 200, win: !win }),
      participant('y', { teamId: 200, win: !win }),
    ],
  })
}

// ── Campaign Record timeline ─────────────────────────────────────

test('timeline: one entry per joint game, ascending by end time, win = the cell team\'s result', () => {
  const games = [
    jointGame({ win: true, endTs: T0 + 2 * HOUR }),
    jointGame({ win: false, endTs: T0 }),
    jointGame({ win: true, endTs: T0 + HOUR }),
  ]
  const { timeline } = computeCellStats(games, ['a', 'b'])
  assert.deepEqual(timeline, [
    { ts: T0, win: false },
    { ts: T0 + HOUR, win: true },
    { ts: T0 + 2 * HOUR, win: true },
  ])
})

test('timeline: the cell losing to a winning stranger is a loss, even though a participant won', () => {
  const { timeline } = computeCellStats([jointGame({ win: false, endTs: T0 })], ['a', 'b'])
  assert.equal(timeline[0].win, false)
})

test('timeline: falls back to the start timestamp, and drops games with no timestamp at all', () => {
  const noEnd = jointGame({ win: true, endTs: T0 })
  delete noEnd.info.gameEndTimestamp
  const none = jointGame({ win: true, endTs: T0 })
  delete none.info.gameEndTimestamp
  delete none.info.gameStartTimestamp
  const { timeline } = computeCellStats([noEnd, none], ['a', 'b'])
  assert.equal(timeline.length, 1)
  assert.equal(timeline[0].ts, noEnd.info.gameStartTimestamp)
})

// ── Link Analysis (duo_stats) ────────────────────────────────────

test('duo_stats: three members on one team form exactly three pairs, each with one game', () => {
  const m = match({
    endTs: T0,
    participants: [
      participant('a', { teamId: 100, win: true }),
      participant('b', { teamId: 100, win: true }),
      participant('c', { teamId: 100, win: true }),
      participant('x', { teamId: 200, win: false }),
    ],
  })
  const { duo_stats } = computeCellStats([m], ['a', 'b', 'c'])
  assert.equal(duo_stats.length, 3)
  const keys = duo_stats.map((d) => d.puuids.join('|')).sort()
  assert.deepEqual(keys, ['a|b', 'a|c', 'b|c'])
  for (const d of duo_stats) {
    assert.equal(d.games, 1)
    assert.equal(d.wins, 1)
    assert.equal(d.win_rate, 1)
  }
})

test('duo_stats: members on opposite teams never form a pair', () => {
  const m = match({
    endTs: T0,
    participants: [
      participant('a', { teamId: 100, win: true }),
      participant('b', { teamId: 100, win: true }),
      participant('c', { teamId: 200, win: false }),
    ],
  })
  const { duo_stats } = computeCellStats([m], ['a', 'b', 'c'])
  assert.deepEqual(duo_stats.map((d) => d.puuids.join('|')), ['a|b'])
})

// ── WR without each operator ─────────────────────────────────────

test('wr_without: the cell\'s win rate in joint games the operator sat out', () => {
  const games = [
    match({ endTs: T0, participants: [participant('a', { win: true }), participant('b', { win: true })] }),
    match({ endTs: T0 + HOUR, participants: [participant('a', { win: false }), participant('c', { win: false })] }),
    match({ endTs: T0 + 2 * HOUR, participants: [participant('b', { win: true }), participant('c', { win: true })] }),
  ]
  const { operator_stats } = computeCellStats(games, ['a', 'b', 'c'])
  const by = Object.fromEntries(operator_stats.map((o) => [o.puuid, o]))
  assert.equal(by.a.wr_without, 1)   // the one game without a (b+c) was a win
  assert.equal(by.b.wr_without, 0)   // the one game without b (a+c) was a loss
  assert.equal(by.c.wr_without, 1)   // the one game without c (a+b) was a win
})

test('wr_without: null for an operator present in every joint game; overall WR for a zero-game roster member', () => {
  const games = [
    jointGame({ win: true, endTs: T0 }),
    jointGame({ win: false, endTs: T0 + HOUR }),
  ]
  const roster = [
    { id: 'u-a', puuid: 'a', riot_game_name: 'a' },
    { id: 'u-b', puuid: 'b', riot_game_name: 'b' },
    { id: 'u-d', puuid: 'd', riot_game_name: 'd' },
  ]
  const { operator_stats, win_rate_together } = computeCellStats(games, ['a', 'b', 'd'], roster)
  const by = Object.fromEntries(operator_stats.map((o) => [o.puuid, o]))
  assert.equal(by.a.wr_without, null)
  assert.equal(by.d.games, 0)
  assert.equal(by.d.wr_without, win_rate_together)
  assert.equal(win_rate_together, 0.5)
})

// ── Game mode breakdown ──────────────────────────────────────────

test('game_mode_breakdown: queueId wins over gameMode, CHERRY falls back to Arena, sorted by games', () => {
  const games = [
    jointGame({ win: true, endTs: T0, queueId: 450, gameMode: 'ARAM' }),
    jointGame({ win: false, endTs: T0 + HOUR, queueId: 450, gameMode: 'ARAM' }),
    jointGame({ win: true, endTs: T0 + 2 * HOUR, queueId: 2400, gameMode: 'ARAM' }),
    jointGame({ win: true, endTs: T0 + 3 * HOUR, queueId: 99999, gameMode: 'CHERRY' }),
  ]
  const { game_mode_breakdown } = computeCellStats(games, ['a', 'b'])
  assert.deepEqual(game_mode_breakdown.map((m) => m.mode), ['ARAM', 'ARAM Mayhem', 'Arena'])
  const aram = game_mode_breakdown.find((m) => m.mode === 'ARAM')
  assert.equal(aram.games, 2)
  assert.equal(aram.win_rate, 0.5)
})

// ── Activity heatmap ─────────────────────────────────────────────

test('heatmap: buckets by UTC weekday and hour of the game end; cells sum to the joint-game count', () => {
  const games = [
    jointGame({ win: true, endTs: T0 }),                 // Wed 20:00Z
    jointGame({ win: true, endTs: T0 + 26 * HOUR }),     // Thu 22:00Z
  ]
  const { heatmap } = computeCellStats(games, ['a', 'b'])
  assert.equal(heatmap[3][20], 1)
  assert.equal(heatmap[4][22], 1)
  assert.equal(heatmap.flat().reduce((s, n) => s + n, 0), 2)
})

// ── Recent form ──────────────────────────────────────────────────

test('recent_form: newest first and capped at ten', () => {
  const games = Array.from({ length: 12 }, (_, i) => jointGame({ win: i % 2 === 0, endTs: T0 + i * HOUR }))
  const { recent_form } = computeCellStats(games, ['a', 'b'])
  assert.equal(recent_form.length, 10)
  assert.equal(recent_form[0].timestamp, T0 + 11 * HOUR)
  assert.equal(recent_form[9].timestamp, T0 + 2 * HOUR)
  assert.equal(recent_form[0].win, false) // game 11 is odd -> loss
})

// ── Champion synergies ───────────────────────────────────────────

test('champion_synergies: the same pairing on the same champions collapses to one entry regardless of order', () => {
  const g1 = match({ endTs: T0, participants: [
    participant('a', { championName: 'Ashe' }), participant('b', { championName: 'Lulu' }),
  ] })
  const g2 = match({ endTs: T0 + HOUR, participants: [
    participant('b', { championName: 'Lulu' }), participant('a', { championName: 'Ashe' }),
  ] })
  const { champion_synergies } = computeCellStats([g1, g2], ['a', 'b'])
  assert.equal(champion_synergies.length, 1)
  assert.equal(champion_synergies[0].games, 2)
  assert.deepEqual(champion_synergies[0].champions, ['Ashe', 'Lulu'])
})

// ── Remake boundaries ────────────────────────────────────────────

test('isRemake: exactly 300 s is a real game, 0 s (missing duration) is not a remake, any early surrender is', () => {
  assert.equal(isRemake(match({ participants: [participant('a')], gameDuration: 300 })), false)
  assert.equal(isRemake(match({ participants: [participant('a')], gameDuration: 0 })), false)
  assert.equal(isRemake(match({ participants: [participant('a')], gameDuration: 299 })), true)
  assert.equal(isRemake(match({ participants: [
    participant('a'), participant('x', { gameEndedInEarlySurrender: true }),
  ] })), true)
})

// ── Mixed-team matches ───────────────────────────────────────────

test('two members on opposite teams: counted in total_games but neither together nor apart', () => {
  const m = match({ endTs: T0, participants: [
    participant('a', { teamId: 100, win: true }),
    participant('b', { teamId: 200, win: false }),
  ] })
  const s = computeCellStats([m], ['a', 'b'])
  assert.equal(s.total_games, 1)
  assert.equal(s.games_together, 0)
  assert.equal(s.games_apart, 0)
  assert.equal(s.win_rate_together, null)
})

// ── Payload shape ────────────────────────────────────────────────

test('assessments: always six cards coded OBS-01..06; redacted ones have no text, real ones do', () => {
  const games = Array.from({ length: 8 }, (_, i) => jointGame({ win: i % 3 !== 0, endTs: T0 + i * HOUR }))
  const { assessments } = computeCellStats(games, ['a', 'b'])
  assert.equal(assessments.length, 6)
  assert.deepEqual(assessments.map((a) => a.code), ['OBS-01', 'OBS-02', 'OBS-03', 'OBS-04', 'OBS-05', 'OBS-06'])
  const redacted = assessments.filter((a) => a.redacted)
  assert.ok(redacted.length >= 1 && redacted.length <= 3)
  for (const a of assessments) {
    if (a.redacted) assert.equal(a.note, null)
    else assert.ok(typeof a.note === 'string' && a.note.length > 0)
  }
})

test('tilt_index stays server-side: it is not part of the payload', () => {
  const games = Array.from({ length: 6 }, (_, i) => jointGame({ win: i % 2 === 0, endTs: T0 + i * HOUR }))
  const stats = computeCellStats(games, ['a', 'b'])
  assert.equal('tilt_index' in stats, false)
})
