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

// POST /operators/validate-riot-id — public pre-signup check (no auth required)
router.post('/validate-riot-id', async (req, res) => {
  const { riotGameName, riotTagLine } = req.body
  if (!riotGameName || !riotTagLine) {
    return res.status(400).json({ error: 'RIOT ID REQUIRED: gameName + tagLine' })
  }
  try {
    const account = await lookupRiotAccount(riotGameName, riotTagLine)
    res.json({ valid: true, gameName: account.gameName, tagLine: account.tagLine })
  } catch (err) {
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
