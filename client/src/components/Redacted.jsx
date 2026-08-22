/**
 * Redaction placeholders — the black bars that stand in for classified or
 * not-yet-available values. Decorative to sighted users; a screen reader
 * hears "[redacted]" instead of a dangling label followed by silence.
 *
 *  <Redacted w h />        inline bar (pad={false} drops the horizontal
 *                          padding so the width matches the stat it replaces)
 *  <Redacted block />      display-block variant used inside table cells
 *  <RedactedBar />         full-width bar for an empty panel body
 */
export function Redacted({ w, h = 8, pad = true, block = false }) {
  return (
    <>
      <span
        className={block ? 'redacted-block' : 'redacted-inline'}
        aria-hidden="true"
        style={{ width: w, height: h, verticalAlign: 'middle', ...(pad ? {} : { padding: 0 }) }}
      />
      <span className="sr-only">[redacted]</span>
    </>
  )
}

export function RedactedBar({ w = '100%', h = 12 }) {
  return (
    <>
      <div className="redacted-bar" aria-hidden="true" style={{ width: w, height: h }} />
      <span className="sr-only">[redacted]</span>
    </>
  )
}
