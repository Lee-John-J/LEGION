import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Retrieval-failure card shared by the Briefing and Operation Log.
 *
 * A 401 means the session has lapsed. The local session is cleared BEFORE
 * routing to /authenticate — otherwise the still-cached session bounces the
 * user straight back to the same 401 and the sign-in form is unreachable.
 */
export default function FetchFault({ error, loading, onRetry, returnTo, subject, access }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const expired = error?.status === 401

  async function reauthenticate() {
    try {
      await logout()
    } catch {
      // supabase-js clears the local session even when the network call fails
    }
    navigate(`/authenticate?return_to=${encodeURIComponent(returnTo)}`)
  }

  return (
    <div className="card fetch-error-card" role="alert">
      <div className="fetch-error-title">
        {expired ? 'CLEARANCE EXPIRED' : 'RETRIEVAL FAULT'}
      </div>
      <p className="fetch-error-note">
        {expired
          ? `Session credentials have lapsed. Re-authenticate to restore ${access}.`
          : `${subject} could not be retrieved. This is a transmission fault — records remain intact.`}
      </p>
      {expired ? (
        <button className="fetch-error-btn" onClick={reauthenticate}>RE-AUTHENTICATE</button>
      ) : (
        <button className="fetch-error-btn" onClick={onRetry} disabled={loading}>
          {loading ? 'RETRYING...' : 'RE-ATTEMPT RETRIEVAL'}
        </button>
      )}
    </div>
  )
}
