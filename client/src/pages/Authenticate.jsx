import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import Footer from '../components/Footer'

/**
 * Only same-origin paths may be used as a post-login destination. The value
 * is resolved against this origin and must stay here — a prefix check alone
 * is not enough, because browsers read "/\evil.com" (and its %5C form) as a
 * cross-origin URL.
 */
function safeReturnTo(raw) {
  if (!raw || !raw.startsWith('/') || raw.includes('\\')) return null
  try {
    const url = new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return url.pathname + url.search
  } catch {
    return null
  }
}

// Supabase's raw error strings, translated into the dossier voice. Anything
// unrecognized falls through verbatim (LEGION's own server errors already
// arrive in-voice).
const AUTH_ERROR_COPY = [
  ['invalid login credentials', 'CREDENTIALS NOT RECOGNIZED. VERIFY EMAIL AND PASSCODE.'],
  ['email not confirmed', 'IDENTITY UNCONFIRMED. COMPLETE THE CONFIRMATION DIRECTIVE SENT TO YOUR EMAIL.'],
  ['already registered', 'AN OPERATOR FILE ALREADY EXISTS FOR THIS ADDRESS. AUTHENTICATE INSTEAD.'],
  ['rate limit', 'REQUEST THROTTLED. STAND BY, THEN RE-SUBMIT.'],
  ['security purposes', 'REQUEST THROTTLED. STAND BY, THEN RE-SUBMIT.'],
  ['password should be', 'PASSCODE MUST BE EIGHT CHARACTERS MINIMUM.'],
  ['valid email', 'EMAIL ADDRESS MALFORMED.'],
]

function describeAuthError(err) {
  const msg = err?.message ?? ''
  const lower = msg.toLowerCase()
  const hit = AUTH_ERROR_COPY.find(([needle]) => lower.includes(needle))
  return hit ? hit[1] : (msg || 'REQUEST FAILED.')
}

export default function Authenticate() {
  const { signIn, signUp, user, cells, cellsLoading, cellsError, passwordRecovery, resetPassword, updatePassword } = useAuth()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('return_to'))
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [riotName, setRiotName] = useState('')
  const [riotTag, setRiotTag] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // During password recovery a session exists, but the user must stay here
  // to set a new passcode — suppress the usual signed-in redirect.
  if (user && cellsLoading && !passwordRecovery) return null
  if (user && !passwordRecovery) {
    if (returnTo) return <Navigate to={returnTo} replace />
    // A failed cell fetch is not "no cells": route to the Briefing, whose
    // overlay offers a retry, instead of steering into a duplicate cell.
    return <Navigate to={cells.length > 0 || cellsError ? '/briefing' : '/intake'} replace />
  }

  function switchMode(next) {
    setMode(next)
    setError(null)
    setResetSent(false)
  }

  async function handleResetRequest(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSetNewPassword(e) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError('PASSCODE MUST BE EIGHT CHARACTERS MINIMUM.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('PASSCODE CONFIRMATION DOES NOT MATCH.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(newPassword)
      // passwordRecovery flips false in useAuth; the redirect above takes over.
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      // The Navigate redirect at the top handles routing once user/cells are loaded
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Enlist under Riot's canonical spelling and casing, not what was
      // typed — every later identity match (YOU badges, roster rows)
      // compares against the canonical form the server stores.
      const verified = await api.validateRiotId({ riotGameName: riotName, riotTagLine: riotTag })
      await signUp(email, password, verified.gameName ?? riotName, verified.tagLine ?? riotTag)
      setSignUpSuccess(true)
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="form-wrapper">
        <div className="form-card intel-reveal">
          <div className="form-card-banner">
            CONFIDENTIAL // OPERATOR AUTHENTICATION // HANDLE WITH CARE
          </div>
          <h1 className="form-title">Authenticate</h1>
          <p className="form-subtitle">
            Sign in to an existing operator file, or open a new one. Your cell
            &mdash; the group you play with &mdash; is created or joined in the
            next step.
          </p>

          {!passwordRecovery && mode !== 'reset' && (
            <div className="auth-tabs" role="tablist">
              <button
                className={`auth-tab${mode === 'signin' ? ' active' : ''}`}
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => switchMode('signin')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => switchMode('signup')}
              >
                New Operator
              </button>
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">ACCESS DENIED: {error}</div>
          )}

          {passwordRecovery && (
            <form onSubmit={handleSetNewPassword}>
              <div className="eyebrow eyebrow-green" style={{ marginBottom: 14 }}>
                RECOVERY CHANNEL VERIFIED
              </div>
              <div className="field">
                <label htmlFor="np-new">NEW PASSCODE</label>
                <input
                  id="np-new"
                  type="password"
                  placeholder="minimum eight characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="field">
                <label htmlFor="np-confirm">CONFIRM PASSCODE</label>
                <input
                  id="np-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'PROCESSING...' : 'SET NEW PASSCODE'}
              </button>
            </form>
          )}

          {!passwordRecovery && mode === 'reset' && !resetSent && (
            <form onSubmit={handleResetRequest}>
              <p className="form-subtitle" style={{ marginTop: 0 }}>
                Provide the email on file. A reset directive will be
                transmitted to that channel.
              </p>
              <div className="field">
                <label htmlFor="reset-email">EMAIL</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'TRANSMITTING...' : 'TRANSMIT RESET DIRECTIVE'}
              </button>
              <div className="forgot-link">
                <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
                  &larr; Return to sign in
                </button>
              </div>
            </form>
          )}

          {!passwordRecovery && mode === 'reset' && resetSent && (
            <div className="auth-success" role="status">
              <div className="eyebrow eyebrow-green">DIRECTIVE TRANSMITTED</div>
              <p>
                If an operator file exists for that address, a reset directive
                has been transmitted. Follow its link to set a new passcode.
              </p>
              <div className="forgot-link" style={{ marginTop: 12 }}>
                <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
                  &larr; Return to sign in
                </button>
              </div>
            </div>
          )}

          {!passwordRecovery && mode === 'signin' && (
            <form onSubmit={handleSignIn}>
              <div className="field">
                <label htmlFor="si-email">EMAIL</label>
                <input
                  id="si-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="si-password">PASSCODE</label>
                <input
                  id="si-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'VERIFYING...' : 'AUTHENTICATE'}
              </button>
              <div className="forgot-link">
                <button type="button" className="link-btn" onClick={() => switchMode('reset')}>
                  Forgot passcode?
                </button>
              </div>
            </form>
          )}

          {!passwordRecovery && mode === 'signup' && !signUpSuccess && (
            <form onSubmit={handleSignUp}>
              <div className="field">
                <label htmlFor="su-email">EMAIL</label>
                <input
                  id="su-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="su-password">PASSCODE</label>
                <input
                  id="su-password"
                  type="password"
                  placeholder="minimum eight characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="riot-id-row">
                <div className="field">
                  <label htmlFor="su-riot-name">RIOT GAME NAME</label>
                  <input
                    id="su-riot-name"
                    type="text"
                    placeholder="YourName"
                    value={riotName}
                    onChange={(e) => setRiotName(e.target.value)}
                    required
                  />
                </div>
                <div className="riot-id-hash" aria-hidden="true">#</div>
                <div className="field">
                  <label htmlFor="su-riot-tag">TAG</label>
                  <input
                    id="su-riot-tag"
                    type="text"
                    placeholder="NA1"
                    value={riotTag}
                    onChange={(e) => setRiotTag(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'PROCESSING...' : 'OPEN OPERATOR FILE'}
              </button>
            </form>
          )}

          {!passwordRecovery && mode === 'signup' && signUpSuccess && (
            <div className="auth-success">
              <div className="eyebrow eyebrow-green">IDENTITY LOGGED</div>
              <p>
                Confirmation transmitted to the provided address. Verify your
                identity to complete intake. Check your email.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer docCode="AUTH-" office="LEGION/AUTH" />
    </>
  )
}
