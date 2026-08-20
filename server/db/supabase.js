const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Fail fast: without the service role key every query would silently run as
// anon under RLS and return empty rows — misconfiguration would present as
// "no data" bugs instead of an obvious startup error.
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    '[LEGION] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set. ' +
    'Refusing to start with a misconfigured database client.'
  )
}

// Service role client — bypasses RLS.
// Safe because every route verifies the user's identity via requireAuth()
// middleware before touching the database.
const supabase = createClient(supabaseUrl, serviceRoleKey)

module.exports = { supabase }
