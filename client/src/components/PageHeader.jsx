import { Redacted } from './Redacted'

// Header redactions are flush so they line up with the values they replace
const R = (props) => <Redacted h={11} pad={false} {...props} />

/**
 * One line of dossier-voice copy per ingest outcome. Every status the server
 * can return gets its own sentence — "0 new matches filed" for a cell with
 * no linked Riot IDs would tell a new cell the opposite of the truth.
 */
function describeSync(result) {
  if (!result) return null
  const fetched = result.fetched ?? 0
  switch (result.status) {
    case 'ERROR':
      return `SYNC FAILED: ${result.message}`
    case 'INGEST_PARTIAL':
      return `INGEST IN PROGRESS — ${fetched} new matches filed, ${result.remaining} pending. Sync again to continue.`
    case 'INGEST_COMPLETE':
      return `INGEST COMPLETE — ${fetched} new matches filed, ${result.skipped ?? 0} already on record`
    case 'NO_LINKED_OPERATORS':
      return 'SYNC HALTED — no operator in this cell has a linked Riot ID on file.'
    case 'NO_MATCHES_FOUND':
      return 'SYNC COMPLETE — Riot returned no matches for this cell\'s operators this season.'
    default:
      return result.message ?? `SYNC STATUS: ${result.status}`
  }
}

/**
 * Sticky page header shared by the Briefing and Operation Log: eyebrow,
 * cell name, meta line, the "+ Sync Intel" trigger, and the sync result.
 */
export default function PageHeader({ eyebrow, hasCell, activeCell, syncing, syncResult, onSync }) {
  const memberCount = hasCell ? (activeCell.member_count ?? 0) : 0
  return (
    <div className="page-header-bar">
      <div className="page-header">
        <div>
          <div className={`eyebrow ${hasCell ? 'eyebrow-green' : ''}`}>
            &bull; {eyebrow} &mdash; {hasCell ? 'ACTIVE' : 'INACTIVE'}
          </div>
          <h1 className="title-hero page-title">
            {hasCell ? activeCell.name : <R w={180} h={28} />}
          </h1>
          <div className="page-meta">
            <strong>{hasCell ? memberCount : <R w={16} />}</strong>
            {' '}operator{memberCount !== 1 ? 's' : ''}
            <span className="meta-divider">//</span>
            region <strong>{hasCell ? 'NA' : <R w={24} />}</strong>
            <span className="meta-divider">//</span>
            established <strong>{hasCell && activeCell.created_at
              ? new Date(activeCell.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : <R w={90} />}</strong>
            <span className="meta-divider">//</span>
            case <strong>LGN-<R w={36} /></strong>
            {hasCell && (
              <>
                <span className="meta-divider">//</span>
                <button
                  className="recruit-btn"
                  onClick={onSync}
                  disabled={syncing}
                >
                  {syncing ? 'SYNCING...' : '+ Sync Intel'}
                </button>
              </>
            )}
          </div>
          {syncResult && (
            <div className="sync-result" role="status">
              {describeSync(syncResult)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
