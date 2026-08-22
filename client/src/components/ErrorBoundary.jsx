import { Component } from 'react'

/**
 * Last line of defense. A render or effect exception anywhere below would
 * otherwise unmount the entire tree to a blank page with nothing to act on.
 * This renders the same dossier-toned fault card the data fetches use, with
 * a reload action.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('[LEGION] Render fault:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page-content">
        <div className="card fetch-error-card" role="alert">
          <div className="fetch-error-title">RETRIEVAL FAULT</div>
          <p className="fetch-error-note">
            This page could not be rendered. This is a transmission fault
            &mdash; records remain intact. Reload to re-attempt.
          </p>
          <button className="fetch-error-btn" onClick={() => window.location.reload()}>
            RELOAD
          </button>
        </div>
      </div>
    )
  }
}
