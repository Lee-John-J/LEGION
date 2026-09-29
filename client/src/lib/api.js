import { supabase } from './supabase'

const BASE = '/api'

// Browser and platform error strings ("Failed to fetch", "Gateway Timeout")
// never reach the UI raw — they are replaced with dossier-voice lines.
const NETWORK_FAULT = 'TRANSMISSION FAULT. CHECK YOUR CONNECTION AND RETRY.'
const REQUEST_FAULT = 'REQUEST FAILED. RETRY SHORTLY.'

async function send(url, options) {
  try {
    return await fetch(url, options)
  } catch {
    const e = new Error(NETWORK_FAULT)
    e.status = 0
    throw e
  }
}

async function failure(res) {
  const body = await res.json().catch(() => ({}))
  // Carry the HTTP status so callers can tell an expired session (401)
  // apart from a server failure and route to re-authentication.
  const e = new Error(body.error || REQUEST_FAULT)
  e.status = res.status
  e.code = body.code
  return e
}

/**
 * Wrapper around fetch that:
 *  1. Reads the current Supabase session token
 *  2. Attaches it as a Bearer token on every request
 *  3. Parses JSON responses and throws on errors
 *
 * Without this, every authenticated backend route returns 401
 * because the server checks for a valid JWT in the Authorization header.
 */
async function request(path, options = {}) {
  // Get the current session's access token
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await send(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) throw await failure(res)
  return res.json()
}

export const api = {
  // Cell endpoints
  getCells: () => request('/cells'),
  createCell: (data) =>
    request('/cells', { method: 'POST', body: JSON.stringify(data) }),
  getCell: (id) => request(`/cells/${id}`),
  joinCellByCode: (invite_code) =>
    request('/cells/join-by-code', { method: 'POST', body: JSON.stringify({ invite_code }) }),
  deleteCell: (id) =>
    request(`/cells/${id}`, { method: 'DELETE' }),
  removeOperator: (cellId, userId) =>
    request(`/cells/${cellId}/members/${userId}`, { method: 'DELETE' }),

  // Match ingest — pulls new match data from Riot API for a cell
  ingestMatches: (id) =>
    request(`/cells/${id}/ingest`, { method: 'POST' }),

  // Stats endpoints (read from cached DB data, no Riot API calls)
  getCellStats: (id) => request(`/cells/${id}/stats`),
  getOperationLog: (id) => request(`/cells/${id}/operations`),

  // Operator endpoints
  linkRiotId: (data) =>
    request('/operators/link', { method: 'POST', body: JSON.stringify(data) }),

  // Public (no auth) — validates Riot ID exists before signup
  validateRiotId: async (data) => {
    const res = await send(`${BASE}/operators/validate-riot-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await failure(res)
    return res.json()
  },
}
