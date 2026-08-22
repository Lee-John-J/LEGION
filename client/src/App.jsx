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

// Per-route document titles so tabs and screen readers can tell pages apart
const TITLES = {
  '/': 'LEGION',
  '/about': 'ABOUT // LEGION',
  '/authenticate': 'AUTHENTICATE // LEGION',
  '/intake': 'INTAKE // LEGION',
  '/briefing': 'BRIEFING // LEGION',
  '/oplog': 'OPERATION LOG // LEGION',
}

function TitleSync() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'LEGION'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TitleSync />
        <Header />
        <main>
          {/* A page-level render fault shows a fault card instead of a blank
              screen; the header above stays usable so the user can navigate */}
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/authenticate" element={<Authenticate />} />
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
