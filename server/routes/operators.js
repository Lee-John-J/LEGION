const express = require('express')
const https = require('https')
const router = express.Router()
const { supabase } = require('../db/supabase')

// Typed Riot API failure so route handlers can tell "user typed a bad
// Riot ID" apart from "our key is bad" and "Riot is down".
class RiotApiError extends Error {
  constructor(kind, status) {
    super(`${kind}:${status}`)
    this.kind = kind // 'NOT_FOUND' | 'BAD_KEY' | 'RATE_LIMITED' | 'RIOT_DOWN' | 'NETWORK'
    this.status = status
  }
}

// Direct Riot API lookup using Node https module (fetch was failing on Vercel)
function lookupRiotAccount(gameName, tagLine) {
  return new Promise((resolve, reject) => {
    const region = process.env.RIOT_REGION || 'americas'
    const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    const options = {
      hostname: `${region}.api.riotgames.com`,
      path,
      method: 'GET',
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { return resolve(JSON.parse(body)) }
          catch { return reject(new RiotApiError('RIOT_DOWN', 200)) }
        }
        if (res.statusCode === 404) return reject(new RiotApiError('NOT_FOUND', 404))
        if (res.statusCode === 401 || res.statusCode === 403) {
          // Our problem, not the user's: missing/expired RIOT_API_KEY.
          // Never log the key value itself.
          console.error(`[riot] auth failure (${res.statusCode}) — check RIOT_API_KEY in this environment`)
          return reject(new RiotApiError('BAD_KEY', res.statusCode))
        }
        if (res.statusCode === 429) return reject(new RiotApiError('RATE_LIMITED', 429))
        return reject(new RiotApiError(res.statusCode >= 500 ? 'RIOT_DOWN' : 'NETWORK', res.statusCode))
      })
    })

    req.on('error', () => reject(new RiotApiError('NETWORK', 0)))
    req.setTimeout(8000, () => { req.destroy(); reject(new RiotApiError('NETWORK', 0)) })
    req.end()
  })
}

// Map a RiotApiError to the HTTP response the client shows the user.
// BAD_KEY / RIOT_DOWN / NETWORK all read as "unavailable" to the user;
// the server log (above) is what distinguishes a config problem.
function sendRiotError(res, err) {
  if (err.kind === 'NOT_FOUND') {
    return res.status(404).json({ code: 'RIOT_ID_NOT_FOUND', error: 'INTAKE FAILED. RIOT ID NOT FOUND.' })
  }
  if (err.kind === 'RATE_LIMITED') {
    return res.status(429).json({ code: 'RATE_LIMITED', error: 'INTAKE QUEUE SATURATED. STAND BY, THEN RE-SUBMIT.' })
  }
  console.error('[riot] lookup failed:', err.kind, err.status)
  return res.status(503).json({ code: 'RIOT_UNAVAILABLE', error: 'RIOT API UNAVAILABLE. TRY AGAIN SHORTLY.' })
}

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'AUTHENTICATION REQUIRED' })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'CLEARANCE DENIED' })
  req.user = user
  next()
}

// ── Abuse guards for the public validate endpoint ────────────────
// validate-riot-id must stay unauthenticated (it runs BEFORE signup), but
// every call costs a Riot API request from the shared quota. Two guards:
// a per-IP throttle and a short result cache. Both are in-memory and
// per-serverless-instance — they bound bursts, not a global guarantee.

const validateHits = new Map() // ip -> { count, windowStart }
const VALIDATE_WINDOW_MS = 60_000
const VALIDATE_MAX_PER_WINDOW = 10

function throttleValidate(req, res, next) {
  const ip = String(req.headers['x-forwarded-for'] ?? req.ip ?? 'unknown').split(',')[0].trim()
  const now = Date.now()
  const entry = validateHits.get(ip)
  if (!entry || now - entry.windowStart > VALIDATE_WINDOW_MS) {
    if (validateHits.size > 5000) validateHits.clear() // bound memory
    validateHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  entry.count++
  if (entry.count > VALIDATE_MAX_PER_WINDOW) {
    return res.status(429).json({ code: 'RATE_LIMITED', error: 'INTAKE QUEUE SATURATED. STAND BY, THEN RE-SUBMIT.' })
  }
  next()
}

const validateCache = new Map() // "name#tag" lowercased -> { hit, ts }
const VALIDATE_CACHE_TTL = 5 * 60 * 1000

function getCachedValidation(key) {
  const entry = validateCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > VALIDATE_CACHE_TTL) {
    validateCache.delete(key)
    return null
  }
  return entry.hit
}

// POST /operators/validate-riot-id — public pre-signup check (no auth required,
// so it is throttled per IP and results are cached — see guards above)
router.post('/validate-riot-id', throttleValidate, async (req, res) => {
  const { riotGameName, riotTagLine } = req.body
  if (!riotGameName || !riotTagLine) {
    return res.status(400).json({ error: 'RIOT ID REQUIRED: gameName + tagLine' })
  }

  const cacheKey = `${riotGameName}#${riotTagLine}`.toLowerCase()
  const cached = getCachedValidation(cacheKey)
  if (cached) {
    if (cached.valid) return res.json(cached)
    return res.status(404).json({ code: 'RIOT_ID_NOT_FOUND', error: 'INTAKE FAILED. RIOT ID NOT FOUND.' })
  }

  try {
    const account = await lookupRiotAccount(riotGameName, riotTagLine)
    const hit = { valid: true, gameName: account.gameName, tagLine: account.tagLine }
    validateCache.set(cacheKey, { hit, ts: Date.now() })
    res.json(hit)
  } catch (err) {
    // Cache only the stable outcome (the ID genuinely doesn't exist);
    // transient Riot failures should retry on the next attempt.
    if (err.kind === 'NOT_FOUND') {
      validateCache.set(cacheKey, { hit: { valid: false }, ts: Date.now() })
    }
    return sendRiotError(res, err)
  }
})

router.post('/link', requireAuth, async (req, res) => {
  try {
    const sb = supabase
    const { riotGameName, riotTagLine } = req.body
    if (!riotGameName || !riotTagLine) {
      return res.status(400).json({ error: 'RIOT ID REQUIRED: gameName + tagLine' })
    }

    // Short-circuit: the client pings /link on every page load (see
    // useAuth.linkRiotIdIfNeeded). When this user's operator row already
    // matches the requested Riot ID, skip the Riot API call and DB writes
    // entirely — otherwise every refresh burns shared Riot quota.
    const { data: current } = await sb
      .from('operators')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (
      current?.is_verified &&
      current.riot_game_name?.toLowerCase() === String(riotGameName).toLowerCase() &&
      current.riot_tag_line?.toLowerCase() === String(riotTagLine).toLowerCase()
    ) {
      return res.json(current)
    }

    let account
    try {
      account = await lookupRiotAccount(riotGameName, riotTagLine)
    } catch (err) {
      return sendRiotError(res, err)
    }

    const { data: existing } = await sb
      .from('operators')
      .select('user_id')
      .eq('puuid', account.puuid)
      .single()

    if (existing && existing.user_id !== req.user.id) {
      return res.status(409).json({
        error: 'RIOT ACCOUNT ALREADY LINKED TO ANOTHER OPERATOR. EACH RIOT ID MAY ONLY BE CLAIMED ONCE.'
      })
    }

    const { data, error } = await sb
      .from('operators')
      .upsert({
        user_id: req.user.id,
        puuid: account.puuid,
        riot_game_name: account.gameName,
        riot_tag_line: account.tagLine,
        is_verified: true,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[LEGION] DB error during operator link:', error.message)
      return res.status(500).json({ error: 'DATABASE ERROR. CONTACT HANDLER.' })
    }
    res.json(data)
  } catch (crash) {
    console.error('[LEGION] operators/link CRASH:', crash)
    return res.status(500).json({ error: 'INTERNAL ERROR' })
  }
})

router.get('/:puuid', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('operators')
    .select('riot_game_name, riot_tag_line, is_verified, created_at')
    .eq('puuid', req.params.puuid)
    .single()

  if (error) return res.status(404).json({ error: 'OPERATOR NOT FOUND' })
  res.json(data)
})

module.exports = router
