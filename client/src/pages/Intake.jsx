import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import Footer from '../components/Footer'
import { Redacted as R } from '../components/Redacted'

export default function Intake() {
  const navigate = useNavigate()
  const { refreshCells, setActiveCell } = useAuth()
  // "JOIN WITH INVITE CODE" links here with ?mode=join preselected
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'join' ? 'join' : 'new')
  const [cellName, setCellName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function selectOption(next) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'new') {
        if (!cellName.trim()) {
          setError('CELL NAME IS REQUIRED.')
          setLoading(false)
          return
        }
        const cell = await api.createCell({ name: cellName.trim() })
        setActiveCell(cell)
        await refreshCells()
        navigate('/briefing')
      } else {
        const code = inviteCode.trim().toUpperCase()
        if (!code) {
          setError('INVITE CODE IS REQUIRED.')
          setLoading(false)
          return
        }
        // Catch typos locally before a server round-trip
        if (!/^LGN-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
          setError('INVITE CODE INVALID OR EXPIRED.')
          setLoading(false)
          return
        }
        const result = await api.joinCellByCode(code)
        const cells = await refreshCells()
        const joined = cells.find((c) => c.id === result.cell_id)
        if (joined) setActiveCell(joined)
        navigate('/briefing')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="form-wrapper">
        <form className="form-card intake-form-card intel-reveal" onSubmit={handleSubmit}>
          <div className="form-card-banner">
            CONFIDENTIAL // CELL INTAKE // HANDLE WITH CARE
          </div>
          <h1 className="form-title">Open New File</h1>
          <p className="form-subtitle">
            Designate a new cell, or join an existing one with its invite code.
            Joint deployments are logged and assessed against{' '}
            <R w={48} h={11} /> baselines once two or more operators are on file.
          </p>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {/* Real radio inputs (visually hidden) so the choice is keyboard-
              operable and announced by screen readers; the label wrapper keeps
              the whole card clickable exactly as before. */}
          <label
            className={`cell-option${mode === 'new' ? ' selected' : ''}`}
          >
            <input
              type="radio"
              name="intake-mode"
              value="new"
              className="sr-only"
              checked={mode === 'new'}
              onChange={() => selectOption('new')}
            />
            <div className="radio-dot" aria-hidden="true" />
            <div>
              <div className="option-title">Open a New Case</div>
              <div className="option-desc">
                Name a new cell. You become its handler and receive an invite
                code to share with your group.
              </div>
            </div>
          </label>

          {mode === 'new' && (
            <div className="cell-name-field">
              <div className="field">
                <label htmlFor="intake-cell-name">CELL NAME</label>
                <input
                  id="intake-cell-name"
                  type="text"
                  placeholder="e.g. NIGHT SHIFT"
                  maxLength={64}
                  value={cellName}
                  onChange={(e) => setCellName(e.target.value)}
                />
              </div>
            </div>
          )}

          <label
            className={`cell-option${mode === 'join' ? ' selected' : ''}`}
          >
            <input
              type="radio"
              name="intake-mode"
              value="join"
              className="sr-only"
              checked={mode === 'join'}
              onChange={() => selectOption('join')}
            />
            <div className="radio-dot" aria-hidden="true" />
            <div>
              <div className="option-title">Join an Existing Case</div>
              <div className="option-desc">
                Enter the invite code shared by an operator in that cell.
              </div>
            </div>
          </label>

          {mode === 'join' && (
            <div className="cell-name-field">
              <div className="field">
                <label htmlFor="intake-invite-code">INVITE CODE</label>
                <input
                  id="intake-invite-code"
                  type="text"
                  placeholder="LGN-XXXX-XXXX"
                  className="invite-code-input"
                  maxLength={13}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'PROCESSING...' : mode === 'join' ? 'JOIN CELL' : 'OPEN NEW FILE'}
          </button>
        </form>
      </section>

      <Footer
        docCode="INTAKE-"
        office="LEGION/INTAKE"
        extra="DISTRIBUTION LIMITED // DECLASSIFY ON: CASE CLOSURE"
      />
    </>
  )
}
