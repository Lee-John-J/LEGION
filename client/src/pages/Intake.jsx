import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import Footer from '../components/Footer'
import { Redacted as R } from '../components/Redacted'

export default function Intake() {
  const navigate = useNavigate()
  const { refreshCells, setActiveCell } = useAuth()
  const [mode, setMode] = useState('new')
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
          <h1 className="form-title">Open a New File</h1>
          <p className="form-subtitle">
            Designate the cell. A case file will be opened on intake; subsequent
            joint deployments are logged and assessed against{' '}
            <R w={48} h={11} /> baselines.
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
                Additional operators may be appended after intake.
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
                Provide the invite code issued by the cell&rsquo;s handler.
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
            {loading ? 'PROCESSING...' : 'OPEN NEW FILE'}
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
