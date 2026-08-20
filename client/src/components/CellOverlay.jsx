import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function CellOverlay() {
  const navigate = useNavigate()
  const { activeCell, cellsLoading, cellsError, refreshCells } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  // Wait until cells have actually been fetched before deciding
  if (cellsLoading) return null

  // State 0: the cell list FAILED to load. Do not fall through to the
  // "no active case file" pitch — that would invite a user who already has
  // a cell to create a duplicate. Offer a retry instead.
  if (cellsError && !activeCell) {
    return (
      <div className="auth-overlay">
        <div className="auth-overlay-card form-card" role="alert">
          <div className="form-card-banner">
            CONFIDENTIAL // RECORDS RETRIEVAL // TEMPORARY FAULT
          </div>
          <h2 className="form-title">Records Unavailable</h2>
          <p className="form-subtitle">
            Case file retrieval failed. This is a transmission fault, not a
            missing file — your records remain intact. Re-attempt retrieval.
          </p>
          <button
            className="submit-btn"
            style={{ width: '100%' }}
            onClick={() => refreshCells()}
          >
            RE-ATTEMPT RETRIEVAL
          </button>
        </div>
      </div>
    )
  }

  // State 1: Logged in, no cell at all → create or join
  if (!activeCell) {
    return (
      <div className="auth-overlay">
        <div className="auth-overlay-card form-card">
          <div className="form-card-banner">
            CONFIDENTIAL // CELL DESIGNATION // HANDLE WITH CARE
          </div>
          <h2 className="form-title">No Active Case File</h2>
          <p className="form-subtitle">
            Intelligence briefings require a designated cell. Open a new case
            file or join an existing cell via invite code to begin surveillance.
          </p>

          <button
            className="submit-btn"
            style={{ width: '100%', marginBottom: 12 }}
            onClick={() => navigate('/intake')}
          >
            OPEN NEW FILE
          </button>

          <button
            className="submit-btn submit-btn-secondary"
            style={{ width: '100%' }}
            onClick={() => navigate('/intake')}
          >
            JOIN WITH INVITE CODE
          </button>
        </div>
      </div>
    )
  }

  // State 2: Has a cell but solo (only 1 member) → show invite code
  const isSolo = (activeCell.member_count ?? 0) <= 1
  const storageKey = `legion_invite_dismissed_${activeCell.id}`
  const wasDismissed = dismissed || localStorage.getItem(storageKey) === '1'

  if (isSolo && !wasDismissed && activeCell.invite_code) {
    return (
      <div className="auth-overlay">
        <div className="auth-overlay-card form-card" style={{ position: 'relative' }}>
          <button
            className="overlay-dismiss"
            onClick={() => {
              localStorage.setItem(storageKey, '1')
              setDismissed(true)
            }}
            title="Dismiss"
          >
            &times;
          </button>

          <div className="form-card-banner">
            CONFIDENTIAL // CELL INTAKE // PENDING OPERATORS
          </div>
          <h2 className="form-title">Append Operators to Cell</h2>
          <p className="form-subtitle">
            Cell <strong>{activeCell.name}</strong> is active with one operator
            on file. Distribute the intake code below to open files on
            additional operators. Joint surveillance begins when two or more
            cell operators deploy on the same team.
          </p>

          <div className="invite-overlay-code-block">
            <div className="invite-overlay-label">CELL INTAKE CODE</div>
            <code className="invite-overlay-code">{activeCell.invite_code}</code>
            <button
              className="invite-copy-btn invite-copy-btn-dark"
              onClick={() => navigator.clipboard.writeText(activeCell.invite_code)}
            >
              COPY CODE
            </button>
          </div>

          <div className="invite-overlay-steps">
            <div className="invite-overlay-step">
              <span className="invite-step-num">01</span>
              <span>Distribute this code to operators in your cell</span>
            </div>
            <div className="invite-overlay-step">
              <span className="invite-step-num">02</span>
              <span>Each operator authenticates at LEGION and opens a file using this code</span>
            </div>
            <div className="invite-overlay-step">
              <span className="invite-step-num">03</span>
              <span>Deploy together. Briefings are filed after the first joint deployment.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
