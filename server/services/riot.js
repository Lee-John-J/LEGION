/**
 * Riot API service layer.
 *
 * Wraps all Riot endpoints with:
 *  1. Token-bucket rate limiting (20 req/sec, 100 req/2min)
 *  2. In-memory response cache (5-min TTL)
 *  3. Automatic retry on 429 (rate limited)
 *
 * The rate limiter uses a simple queue: every request goes through
 * waitForSlot() before hitting the network, so one sync cannot burst past
 * Riot's limits. Limiter and cache are in-memory and therefore PER WARM
 * SERVERLESS INSTANCE on Vercel: they bound a single instance's bursts,
 * they are not a global guarantee across concurrent instances.
 */

const RIOT_API_KEY = process.env.RIOT_API_KEY
const RIOT_REGION = process.env.RIOT_REGION || 'americas'
// A hung upstream connection must not consume the 60 s serverless budget
const RIOT_REQUEST_TIMEOUT_MS = 8000

// ── In-memory cache (5-min TTL) ──────────────────────────────────

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

function getCached(url) {
  if (!cache.has(url)) return null
  const { data, ts } = cache.get(url)
  if (Date.now() - ts > CACHE_TTL) {
    cache.delete(url)
    return null
  }
  return data
}

function setCache(url, data) {
  // Entries only expire on read, so without a cap a warm instance would
  // hold every URL it has ever fetched.
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear()
  cache.set(url, { data, ts: Date.now() })
}

// ── Token-bucket rate limiter ────────────────────────────────────
// Two buckets: 20 tokens/sec and 100 tokens/2min.
// Requests wait in a FIFO queue until both buckets have capacity.

const buckets = {
  perSecond:  { tokens: 20, max: 20,  refillMs: 1000,    lastRefill: Date.now() },
  per2Min:    { tokens: 100, max: 100, refillMs: 120_000, lastRefill: Date.now() },
}

function refillBucket(b) {
  const now = Date.now()
  const elapsed = now - b.lastRefill
  if (elapsed <= 0) return
  // Continuous (proportional) refill; tokens may be fractional. The old
  // whole-bucket-per-interval refill let ~2x the limit through at an
  // interval boundary, inviting 429s.
  b.tokens = Math.min(b.max, b.tokens + (elapsed / b.refillMs) * b.max)
  b.lastRefill = now
}

function canConsume() {
  refillBucket(buckets.perSecond)
  refillBucket(buckets.per2Min)
  return buckets.perSecond.tokens >= 1 && buckets.per2Min.tokens >= 1
}

function consume() {
  buckets.perSecond.tokens -= 1
  buckets.per2Min.tokens -= 1
}

const queue = []
let draining = false

function waitForSlot() {
  return new Promise((resolve) => {
    queue.push(resolve)
    if (!draining) drainQueue()
  })
}

async function drainQueue() {
  draining = true
  while (queue.length > 0) {
    if (canConsume()) {
      consume()
      const next = queue.shift()
      next()
    } else {
      // Wait a short tick and retry
      await new Promise((r) => setTimeout(r, 60))
    }
  }
  draining = false
}

// ── Core fetch with caching + rate limiting ──────────────────────

// cacheable: false for payloads that are persisted elsewhere (match details
// go straight to the DB and are never requested twice), so they don't fill
// the cache for zero hits.
async function riotFetch(url, { retries = 2, cacheable = true } = {}) {
  if (cacheable) {
    const cached = getCached(url)
    if (cached) return cached
  }

  // Wait for rate limit slot
  await waitForSlot()

  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
    signal: AbortSignal.timeout(RIOT_REQUEST_TIMEOUT_MS),
  })

  if (res.status === 429) {
    if (retries <= 0) throw new Error('RATE_LIMITED')
    // Retry-After may be an HTTP date (parseInt -> NaN, which would retry
    // instantly), and honoring a long wait would blow the 60s serverless
    // budget — default NaN to 2s and cap the sleep at 10s.
    const parsed = parseInt(res.headers.get('Retry-After') || '2', 10)
    const retryAfter = Math.min(Number.isFinite(parsed) ? parsed : 2, 10)
    console.warn(`[RIOT] Rate limited — retrying in ${retryAfter}s`)
    await new Promise((r) => setTimeout(r, retryAfter * 1000))
    return riotFetch(url, { retries: retries - 1, cacheable })
  }

  if (res.status === 404) {
    throw new Error('NOT_FOUND')
  }

  if (res.status === 401 || res.status === 403) {
    // Our problem, not the caller's: missing/expired RIOT_API_KEY.
    console.error(`[RIOT] auth failure (${res.status}) — check RIOT_API_KEY in this environment`)
    throw new Error(`BAD_KEY:${res.status}`)
  }

  if (!res.ok) {
    throw new Error(`RIOT_API_ERROR:${res.status}`)
  }

  const data = await res.json()
  if (cacheable) setCache(url, data)
  return data
}

// ── Public API ───────────────────────────────────────────────────

async function getAccountByRiotId(gameName, tagLine) {
  const url = `https://${RIOT_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  return riotFetch(url)
}

async function getMatchIdsPaginated(puuid, { maxMatches = 500, startTime } = {}) {
  const allIds = []
  let start = 0
  const batchSize = 100

  while (allIds.length < maxMatches) {
    const count = Math.min(batchSize, maxMatches - allIds.length)
    let url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`
    if (startTime) url += `&startTime=${startTime}`
    const ids = await riotFetch(url)

    if (!ids || ids.length === 0) break
    allIds.push(...ids)

    if (ids.length < count) break
    start += ids.length
  }

  return allIds
}

async function getMatch(matchId) {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`
  return riotFetch(url, { cacheable: false })
}

module.exports = { getAccountByRiotId, getMatchIdsPaginated, getMatch }
