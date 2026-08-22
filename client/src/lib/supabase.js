import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail fast with a readable message instead of the library's generic throw:
// a missing key otherwise presents as a blank page with no explanation.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[LEGION] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set — see client/.env.example'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
