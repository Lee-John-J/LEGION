import { useState, useEffect, useRef } from 'react'

export default function ConfirmModal({ label, title, description, confirmText, error, busy, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('')
  const inputRef = useRef(null)
  const modalRef = useRef(null)

  // Focus the input on open; put focus back where it came from on close
  useEffect(() => {
    const previouslyFocused = document.activeElement
    inputRef.current?.focus()
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      // Focus trap: Tab cycles inside the dialog instead of escaping into
      // the dimmed page behind it (WCAG 2.4.3)
      if (e.key === 'Tab') {
        const nodes = modalRef.current?.querySelectorAll('input, button:not(:disabled)')
        if (!nodes || nodes.length === 0) return
        const list = Array.from(nodes)
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const match = typed.trim().toUpperCase() === confirmText.toUpperCase()

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-header">
          <div className="confirm-header-label">{label}</div>
          <div className="confirm-header-title" id="confirm-modal-title">{title}</div>
        </div>
        <div className="confirm-body">
          <p>{description}</p>
          <label className="confirm-input-label" htmlFor="confirm-input">
            Type <strong>{confirmText}</strong> to confirm
          </label>
          <input
            id="confirm-input"
            ref={inputRef}
            className="confirm-input"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && match && !busy) onConfirm() }}
            placeholder={confirmText}
            spellCheck={false}
            autoComplete="off"
          />
          {error && (
            <div className="confirm-error" role="alert">{error}</div>
          )}
        </div>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>CANCEL</button>
          <button className="confirm-execute" disabled={!match || busy} onClick={onConfirm}>
            {busy ? 'EXECUTING...' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  )
}
