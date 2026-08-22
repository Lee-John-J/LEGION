import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { DEV_MOCK } from '../lib/devMock'

const AuthContext = createContext(null)

const ACTIVE_CELL_KEY = 'legion_active_cell'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cells, setCells] = useState([])
  const [activeCell, setActiveCellState] = useState(null)
  const [cellsLoading, setCellsLoading] = useState(true)
  const [riotLinkError, setRiotLinkError] = useState(null)
  const [cellsError, setCellsError] = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const fetchCells = useCallback(async () => {
    setCellsLoading(true)
    try {
      const data = await api.getCells()
      setCells(data)
      setCellsError(false)
      return data
    } catch {
      // Keep "failed to load" distinct from "has no cells" — treating an
      // outage as a zero-cell account steers users toward creating a
      // duplicate cell they already have.
      setCells([])
      setCellsError(true)
      return []
    } finally {
      setCellsLoading(false)
    }
  }, [])

  const setActiveCell = useCallback((cell) => {
    setActiveCellState(cell)
    if (cell) {
      localStorage.setItem(ACTIVE_CELL_KEY, JSON.stringify(cell))
    } else {
      localStorage.removeItem(ACTIVE_CELL_KEY)
    }
  }, [])

  // Restore active cell from localStorage, then validate against fetched cells
  const restoreActiveCell = useCallback((fetchedCells) => {
    const stored = localStorage.getItem(ACTIVE_CELL_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const match = fetchedCells.find((c) => c.id === parsed.id)
        if (match) {
          setActiveCellState(match)
          return
        }
      } catch { /* ignore corrupt localStorage */ }
    }
    // Default to first cell if available
    if (fetchedCells.length > 0) {
      setActiveCell(fetchedCells[0])
    } else {
      setActiveCell(null)
    }
  }, [setActiveCell])

  const refreshCells = useCallback(async () => {
    const data = await fetchCells()
    restoreActiveCell(data)
    return data
  }, [fetchCells, restoreActiveCell])

  const linkRiotIdIfNeeded = useCallback(async (user) => {
    const name = user.user_metadata?.riot_game_name
    const tag = user.user_metadata?.riot_tag_line
    if (!name || !tag) {
      console.warn('[LEGION] No Riot ID in user metadata — skipping link')
      return
    }

    // Skip the network call when this browser already linked this exact Riot
    // ID for this user — without this, every page load re-links. The server
    // has its own short-circuit too, so clearing localStorage is always safe.
    const linkKey = `legion_linked:${user.id}`
    const linkVal = `${name}#${tag}`.toLowerCase()
    try {
      if (localStorage.getItem(linkKey) === linkVal) return
    } catch { /* storage unavailable — fall through to the network call */ }

    try {
      await api.linkRiotId({ riotGameName: name, riotTagLine: tag })
      setRiotLinkError(null)
      try { localStorage.setItem(linkKey, linkVal) } catch { /* non-fatal */ }
    } catch (err) {
      console.error(`[LEGION] Riot ID link failed for ${name}#${tag}:`, err.message)
      setRiotLinkError(`RIOT ID LINK FAILED FOR ${name}#${tag}: ${err.message}`)
    }
  }, [])

  useEffect(() => {
    // Initial session lookup runs once; the auth-state subscription below
    // owns every later transition (sign-in, sign-out, password recovery).
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSession(session)
          setLoading(false)
          linkRiotIdIfNeeded(session.user)
          refreshCells()
        } else if (import.meta.env.DEV) {
          // Dev preview: fake a signed-in operator on the mock cell. The
          // literal import.meta.env.DEV gate (not the DEV_MOCK alias — the
          // bundler only folds the literal) plus the dynamic import keep
          // mockData.js out of production bundles entirely.
          const { MOCK_USER, MOCK_CELLS, MOCK_ACTIVE_CELL } = await import('../lib/mockData')
          setSession({ user: MOCK_USER, access_token: 'mock' })
          setCells(MOCK_CELLS)
          setActiveCellState(MOCK_ACTIVE_CELL)
          setLoading(false)
          setCellsLoading(false)
        } else {
          setSession(null)
          setLoading(false)
          setCellsLoading(false)
        }
      } catch {
        // Never leave the app stuck behind the loading gate if the session
        // lookup itself rejects — that renders as a permanently blank page.
        setLoading(false)
        setCellsLoading(false)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && DEV_MOCK) return
      // User arrived via a password-reset email link: hold them on the
      // Authenticate page to set a new passcode instead of redirecting.
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(session)
      if (event === 'SIGNED_IN' && session?.user) {
        linkRiotIdIfNeeded(session.user)
        refreshCells()
      }
      if (event === 'SIGNED_OUT') {
        setCells([])
        setActiveCell(null)
        setCellsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshCells, setActiveCell, linkRiotIdIfNeeded])

  // Re-validate session when the tab becomes visible again (e.g. after sleep)
  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.visibilityState !== 'visible' || DEV_MOCK) return
      try {
        const { data: { session: fresh } } = await supabase.auth.getSession()
        if (fresh) {
          setSession(fresh)
        } else if (session) {
          setSession(null)
          setCells([])
          setActiveCell(null)
        }
      } catch { /* transient lookup failure — keep the current session */ }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session, setActiveCell])

  const signUp = useCallback(async (email, password, riotGameName, riotTagLine) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { riot_game_name: riotGameName, riot_tag_line: riotTagLine } }
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/authenticate`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setPasswordRecovery(false)
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    cells,
    cellsLoading,
    cellsError,
    activeCell,
    setActiveCell,
    refreshCells,
    riotLinkError,
    passwordRecovery,
    resetPassword,
    updatePassword,
    signUp,
    signIn,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Provider and hook are deliberately co-located; a full reload of auth state
// when editing this file is acceptable, and splitting the hook into its own
// file would churn every consumer import for a dev-only nicety.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
