const { supabase } = require('../db/supabase')

/**
 * requireAuth — JWT gate for every protected route.
 *
 * Reads `Authorization: Bearer <token>`, asks Supabase to verify it, and
 * attaches the resolved user to `req.user`. Responds 401 when the header is
 * missing or the token is invalid/expired. Shared by the cells and operators
 * routers so the check cannot drift between them.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) return res.status(401).json({ error: 'AUTHENTICATION REQUIRED' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) {
    // A transient Auth-service fault is not an invalid token: answering 401
    // would make the client treat a brief outage as an expired session and
    // sign everyone out.
    const transient = error.name === 'AuthRetryableFetchError' || (error.status ?? 0) >= 500
    if (transient) return res.status(503).json({ error: 'CLEARANCE SERVICE UNAVAILABLE. RETRY SHORTLY.' })
    return res.status(401).json({ error: 'CLEARANCE DENIED' })
  }
  if (!user) return res.status(401).json({ error: 'CLEARANCE DENIED' })
  req.user = user
  next()
}

module.exports = { requireAuth }
