import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import About from './pages/About'
import Authenticate from './pages/Authenticate'
import Intake from './pages/Intake'
import Briefing from './pages/Briefing'
import OperationLog from './pages/OperationLog'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

const SITE = 'https://www.legion.report'

// Per-route document titles so tabs and screen readers can tell pages apart.
// No Riot trademarks in titles: Riot's fan-content policy bars using its
// names as search keywords, so they stay in descriptive copy only.
const TITLES = {
  '/': 'LEGION // Group Stats for Players Who Queue Together',
  '/about': 'ABOUT // LEGION',
  '/authenticate': 'AUTHENTICATE // LEGION',
  '/intake': 'INTAKE // LEGION',
  '/briefing': 'BRIEFING // LEGION',
  '/oplog': 'OPERATION LOG // LEGION',
  '/privacy': 'PRIVACY // LEGION',
  '/terms': 'TERMS // LEGION',
}

// Search-result summaries for the public pages; any other route keeps the
// site-wide description from index.html
const DESCRIPTIONS = {
  '/about': 'How LEGION works: open an operator file, designate your cell, share its invite code, and sync the matches you play together. Includes a glossary of field terms.',
  '/authenticate': 'Sign in to LEGION, or open a new operator file for yourself and your cell.',
  '/privacy': 'What information LEGION collects, who can see it, where it is stored, and how to have it deleted.',
  '/terms': 'The rules for using LEGION: eligibility, acceptable use, and the limits of the service.',
}

// Title, description, and canonical URL follow the route. Invisible on the
// page; they shape search results and keep the www address authoritative.
function RouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'LEGION'
    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.dataset.default ??= description.content
      description.content = DESCRIPTIONS[pathname] ?? description.dataset.default
    }
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.href = SITE + pathname
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteMeta />
        <Header />
        <main>
          {/* A page-level render fault shows a fault card instead of a blank
              screen; the header above stays usable so the user can navigate */}
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/authenticate" element={<Authenticate />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/intake" element={
                <ProtectedRoute><Intake /></ProtectedRoute>
              } />
              <Route path="/briefing" element={
                <ProtectedRoute><Briefing /></ProtectedRoute>
              } />
              <Route path="/oplog" element={
                <ProtectedRoute><OperationLog /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}
