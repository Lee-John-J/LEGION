import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { MOCK_OPERATIONS, isMockCell } from '../lib/mockData'
import CellOverlay from '../components/CellOverlay'
import Footer from '../components/Footer'

function R({ w, h = 12 }) {
  return (
    <>
      <span
        className="redacted-block"
        aria-hidden="true"
        style={{ width: w, height: h, verticalAlign: 'middle' }}
      />
      <span className="sr-only">[redacted]</span>
    </>
  )
}

function RedactedMatchRow() {
  return (
    <div className="match-row sealed">
      <div className="match-row-head">
        <span className="result-tag"><R w={28} h={10} /></span>
        <span className="match-mode"><R w={50} h={10} /></span>
        <span className="match-duration"><R w={36} h={12} /></span>
        <span className="match-time"><R w={48} h={10} /></span>
      </div>
      <div className="table-scroll">
      <table className="match-ops">
        <thead>
          <tr>
            <th scope="col">Operator</th>
            <th scope="col">Champion</th>
            <th scope="col">KDA</th>
            <th scope="col" className="col-num">Damage</th>
            <th scope="col" className="col-num">Gold</th>
          </tr>
        </thead>
        <tbody>
          {[130, 110, 100].map((w, i) => (
            <tr key={i}>
              <td><R w={w} h={12} /></td>
              <td><R w={60} h={12} /></td>
              <td><R w={70} h={12} /></td>
              <td className="col-num"><R w={40} h={12} /></td>
              <td className="col-num"><R w={36} h={12} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatDamage(dmg) {
  if (!dmg) return '0'
  if (dmg >= 1000) return (dmg / 1000).toFixed(1) + 'k'
  return String(dmg)
}

// Win-rate accent color: green above 50%, red below, neutral at 50%
function wrAccentColor(rate) {
  if (rate == null) return 'var(--muted)'
  if (rate > 0.50) return 'var(--green)'
  if (rate < 0.50) return 'var(--red)'
  return 'var(--muted)'
}

const STAPLE_MODES = ['Ranked', 'Ranked Flex', 'Normal', 'ARAM', 'ARAM Mayhem', 'Arena']

function resolveMode(gameMode, queueId) {
  const queueMap = {
    420: 'Ranked',
    440: 'Ranked Flex',
    400: 'Normal',
    430: 'Normal',
    450: 'ARAM',
    2400: 'ARAM Mayhem',
    900: 'URF',
    1020: 'One for All',
    1300: 'Nexus Blitz',
    1700: 'Arena',
    1900: 'URF',
  }
  if (queueId != null && queueMap[queueId]) return queueMap[queueId]

  const modeMap = {
    CLASSIC: 'Normal',
    ARAM: 'ARAM',
    CHERRY: 'Arena',
    NEXUSBLITZ: 'Nexus Blitz',
    URF: 'URF',
    ARURF: 'ARURF',
    ULTBOOK: 'Ultimate Spellbook',
    ONEFORALL: 'One for All',
  }
  return modeMap[gameMode?.toUpperCase?.()] || gameMode || 'UNKNOWN'
}

function isRotating(modeName) {
  return !STAPLE_MODES.includes(modeName)
}

// Lane order for Summoner's Rift games with assigned roles
const ROLE_ORDER = { TOP: 0, JUNGLE: 1, MIDDLE: 2, BOTTOM: 3, UTILITY: 4 }

// Arena final standing: 1 -> "1ST", 2 -> "2ND", etc.
function formatPlacement(n) {
  const suffix = n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'
  return `${n}${suffix}`
}

export default function OperationLog() {
  const { user, activeCell } = useAuth()
  const [operations, setOperations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [filterMode, setFilterMode] = useState('All')
  const [filterOutcome, setFilterOutcome] = useState('All')
  const [filterScope, setFilterScope] = useState('full')
  const [activeOperators, setActiveOperators] = useState(null)

  const cellId = activeCell?.id
  const hasCell = !!(user && activeCell)
  const hasData = operations && operations.length > 0

  // Monotonic token: a slow response for a previously viewed cell must never
  // overwrite the current cell's log (cell-switch race).
  const fetchSeq = useRef(0)

  const fetchOps = useCallback(async () => {
    if (!cellId) return
    const seq = ++fetchSeq.current
    setLoading(true)
    setFetchError(null)
    try {
      const data = isMockCell(cellId) ? MOCK_OPERATIONS : await api.getOperationLog(cellId)
      if (seq === fetchSeq.current) setOperations(data)
    } catch (err) {
      if (seq === fetchSeq.current) {
        setOperations(null)
        setFetchError(err)
      }
    } finally {
      if (seq === fetchSeq.current) setLoading(false)
    }
  }, [cellId])

  // Switching cells resets everything cell-specific: the previous cell's
  // filters would otherwise ghost-filter the new cell's log (stale operator
  // names, possibly a game mode the new cell never played).
  useEffect(() => {
    setOperations(null)
    setSyncResult(null)
    setFetchError(null)
    setFilterMode('All')
    setFilterOutcome('All')
    setFilterScope('full')
    setActiveOperators(null)
  }, [cellId])

  useEffect(() => {
    if (hasCell) fetchOps()
    else setOperations(null)
  }, [hasCell, fetchOps])

  async function handleSync() {
    if (!cellId || syncing) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await api.ingestMatches(cellId)
      setSyncResult(result)
      await fetchOps()
    } catch (err) {
      setSyncResult({ status: 'ERROR', message: err.message })
    } finally {
      setSyncing(false)
    }
  }

  // Build operator list sorted by win rate (highest first)
  const allOperatorNames = useMemo(() => {
    const opMap = {}
    for (const op of (operations ?? [])) {
      for (const p of (op.participants ?? [])) {
        if (!p.name) continue
        if (!opMap[p.name]) opMap[p.name] = { wins: 0, games: 0 }
        opMap[p.name].games++
        if (op.result === 'WIN') opMap[p.name].wins++
      }
    }
    return Object.entries(opMap)
      .sort(([, a], [, b]) => (b.games > 0 ? b.wins / b.games : 0) - (a.games > 0 ? a.wins / a.games : 0) || b.games - a.games)
      .map(([name]) => name)
  }, [operations])

  // Initialize the operator filter to "everyone" once the log arrives.
  // activeOperators resets to null on cell switch (effect above), so this
  // re-initializes per cell.
  useEffect(() => {
    if (allOperatorNames.length > 0 && activeOperators === null) {
      setActiveOperators(new Set(allOperatorNames))
    }
  }, [allOperatorNames, activeOperators])

  const currentOps = activeOperators ?? new Set(allOperatorNames)

  const toggleOperator = (name) => {
    if (filterScope === 'full') {
      // Leaving full dossier — only the clicked operator is selected
      setActiveOperators(new Set([name]))
      setFilterScope('roster')
    } else {
      const next = new Set(currentOps)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      setActiveOperators(next)
    }
  }

  const activateFullDossier = () => {
    setFilterScope('full')
    setActiveOperators(new Set(allOperatorNames))
  }

  const filtersAreDirty = filterMode !== 'All' ||
    filterOutcome !== 'All' ||
    filterScope !== 'full'

  const resetFilters = () => {
    setFilterMode('All')
    setFilterOutcome('All')
    setFilterScope('full')
    setActiveOperators(new Set(allOperatorNames))
  }

  const filtered = (operations ?? []).filter((op) => {
    if (filterMode !== 'All' && resolveMode(op.game_mode, op.queue_id) !== filterMode) return false
    if (filterOutcome === 'Wins' && !op.cell_members_won) return false
    if (filterOutcome === 'Losses' && op.cell_members_won) return false
    // Scope: 'full' = all joint deployments; 'roster' = exact operator match
    if (filterScope === 'roster' && activeOperators !== null) {
      const opNames = (op.participants ?? []).map((p) => p.name)
      // Every participant must be selected (no unselected in game)
      if (!opNames.every((n) => currentOps.has(n))) return false
      // Every selected operator must be a participant (all selected were present)
      if (![...currentOps].every((n) => opNames.includes(n))) return false
    }
    return true
  })

  const grouped = []
  let currentDate = null
  for (const op of filtered) {
    const dateStr = formatDate(op.game_end_timestamp)
    if (dateStr !== currentDate) {
      currentDate = dateStr
      grouped.push({ date: dateStr, ops: [] })
    }
    grouped[grouped.length - 1].ops.push(op)
  }

  const totalWins = filtered.filter((o) => o.cell_members_won).length
  const totalLosses = filtered.length - totalWins
  const jointWR = filtered.length > 0 ? totalWins / filtered.length : null
  const avgDuration = filtered.length > 0
    ? Math.round(filtered.reduce((sum, o) => sum + (o.game_duration ?? 0), 0) / filtered.length)
    : null

  const modes = ['All', ...new Set((operations ?? []).map((o) => resolveMode(o.game_mode, o.queue_id)))]

  const currentUserName = user?.user_metadata?.riot_game_name ?? null

  return (
    <>
      {user && <CellOverlay />}

      <div className="page-header-bar">
        <div className="page-header">
          <div>
            <div className={`eyebrow ${hasCell ? 'eyebrow-green' : ''}`}>
              &bull; OPERATION LOG &mdash; {hasCell ? 'ACTIVE' : 'INACTIVE'}
            </div>
            <h1 className="title-hero page-title">
              {hasCell ? activeCell.name : <R w={180} h={28} />}
            </h1>
            <div className="page-meta">
              <strong>{hasCell ? (activeCell.member_count ?? 0) : <R w={16} h={11} />}</strong> operator{(hasCell ? activeCell.member_count : 0) !== 1 ? 's' : ''}
              <span className="meta-divider">//</span>
              region <strong>{hasCell ? 'NA' : <R w={24} h={11} />}</strong>
              <span className="meta-divider">//</span>
              established <strong>{hasCell && activeCell.created_at
                ? new Date(activeCell.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : <R w={90} h={11} />}</strong>
              <span className="meta-divider">//</span>
              case <strong>LGN-<R w={36} h={11} /></strong>
              {hasCell && (
                <>
                  <span className="meta-divider">//</span>
                  <button
                    className="recruit-btn"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    {syncing ? 'SYNCING...' : '+ Sync Intel'}
                  </button>
                </>
              )}
            </div>
            {syncResult && (
              <div className="sync-result" role="status">
                {syncResult.status === 'ERROR'
                  ? `SYNC FAILED: ${syncResult.message}`
                  : syncResult.remaining > 0
                  ? `INGEST IN PROGRESS — ${syncResult.fetched ?? 0} new matches filed, ${syncResult.remaining} pending. Sync again to continue.`
                  : `INGEST COMPLETE — ${syncResult.fetched ?? 0} new matches filed, ${syncResult.skipped ?? 0} already on record`}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`page-content${hasCell && !operations && !fetchError ? ' loading' : ''}`}>

        {/* ── FETCH FAILURE NOTICE (distinct from loading) ── */}
        {hasCell && fetchError && !operations && (
          <div className="card fetch-error-card" role="alert">
            <div className="fetch-error-title">
              {fetchError.status === 401 ? 'CLEARANCE EXPIRED' : 'RETRIEVAL FAULT'}
            </div>
            <p className="fetch-error-note">
              {fetchError.status === 401
                ? 'Session credentials have lapsed. Re-authenticate to restore log access.'
                : 'The operation log could not be retrieved. This is a transmission fault — records remain intact.'}
            </p>
            {fetchError.status === 401 ? (
              <a className="fetch-error-btn" href="/authenticate?return_to=/oplog">RE-AUTHENTICATE</a>
            ) : (
              <button className="fetch-error-btn" onClick={fetchOps} disabled={loading}>
                {loading ? 'RETRYING...' : 'RE-ATTEMPT RETRIEVAL'}
              </button>
            )}
          </div>
        )}

        {/* ── SUMMARY STRIP ── */}
        <div className="summary-strip intel-stagger">
          <div className="summary-card">
            <div className="summary-card-accent" style={{ background: hasData ? wrAccentColor(jointWR) : 'var(--muted)' }} />
            <div className="summary-label">Joint Win Rate</div>
            <div className="summary-value" style={hasData ? { color: wrAccentColor(jointWR) } : undefined}>
              {hasData ? `${(jointWR * 100).toFixed(1)}%` : <R w={100} h={36} />}
            </div>
            <div className="summary-sub">
              {hasData ? `across ${filtered.length} matches` : <R w={90} h={10} />}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-accent" style={{ background: 'var(--green)' }} />
            <div className="summary-label">Total Wins</div>
            <div className="summary-value" style={{ color: 'var(--green)' }}>
              {hasData ? totalWins : <R w={60} h={36} />}
            </div>
            <div className="summary-sub">
              {hasData ? 'current season' : <R w={80} h={10} />}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-accent" style={{ background: 'var(--red)' }} />
            <div className="summary-label">Total Losses</div>
            <div className="summary-value val-red">
              {hasData ? totalLosses : <R w={60} h={36} />}
            </div>
            <div className="summary-sub">
              {hasData ? 'current season' : <R w={80} h={10} />}
            </div>
          </div>
          <div className="summary-card">
            {/* Neutral slate, not amber — amber means anomaly in this system
                and average duration is not one */}
            <div className="summary-card-accent" style={{ background: 'var(--slate-2)' }} />
            <div className="summary-label">Avg. Duration</div>
            <div className="summary-value">
              {hasData ? formatDuration(avgDuration) : <R w={80} h={36} />}
            </div>
            <div className="summary-sub">
              {hasData ? 'per deployment' : <R w={70} h={10} />}
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="filter-bar intel-reveal reveal-d4">
          <div className="filter-bar-head">
            <span className="filter-bar-head-label">Filters</span>
            <button
              type="button"
              className="reset-filters-btn"
              disabled={!filtersAreDirty}
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>
          <div className="filter-row">
            <span className="filter-label" id="filter-theater-label">THEATER</span>
            <div className="filter-chips" role="group" aria-labelledby="filter-theater-label">
              {modes.map((m) => (
                <button
                  className={`chip${filterMode === m ? ' active' : ''}`}
                  key={m}
                  aria-pressed={filterMode === m}
                  onClick={() => setFilterMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label" id="filter-outcome-label">OUTCOME</span>
            <div className="filter-chips" role="group" aria-labelledby="filter-outcome-label">
              {['All', 'Wins', 'Losses'].map((o) => (
                <button
                  className={`chip${filterOutcome === o ? ' active' : ''}`}
                  key={o}
                  aria-pressed={filterOutcome === o}
                  onClick={() => setFilterOutcome(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          {allOperatorNames.length > 0 && (
            <div className="filter-row">
              <span className="filter-label" id="filter-operators-label">OPERATORS</span>
              <div className="filter-chips" role="group" aria-labelledby="filter-operators-label">
                <button
                  className={`chip${filterScope === 'full' ? ' active' : ''}`}
                  aria-pressed={filterScope === 'full'}
                  onClick={activateFullDossier}
                >
                  Full Dossier
                </button>
                {allOperatorNames.map((name) => (
                  <button
                    className={`chip operator-chip${filterScope === 'full' ? '' : currentOps.has(name) ? ' active' : ' inactive'}`}
                    key={name}
                    aria-pressed={filterScope === 'full' || currentOps.has(name)}
                    onClick={() => toggleOperator(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MATCH LIST ── */}
        <div className="match-list intel-reveal reveal-d5">
          <div className="match-list-head">
            <h2 className="match-list-title">Deployment History</h2>
            <div className="match-list-count" role="status">
              SHOWING {filtered.length} OF {(operations ?? []).length}
            </div>
          </div>

          {hasData && filterScope === 'roster' && currentOps.size === 1 ? (
            <div className="scope-notice">
              <div className="scope-notice-label">SINGLE OPERATOR SELECTED</div>
              <div className="scope-notice-text">
                Individual operator performance falls outside the scope of this surveillance program.
                LEGION monitors joint deployments exclusively — operations involving two or more
                operators from the same cell. Select additional operators to review deployment history.
              </div>
              <div className="scope-notice-ref">Solo Reports Filed: 0</div>
            </div>
          ) : hasData ? (
            grouped.map((group, gi) => (
              <div key={gi}>
                <div className="match-day-header">
                  {group.date} &mdash; <span className="day-count">{group.ops.length}</span> deployment{group.ops.length !== 1 ? 's' : ''}
                </div>
                {group.ops.map((op) => (
                  <div
                    key={op.match_id}
                    className={`match-row ${op.cell_members_won ? 'win' : 'loss'}`}
                  >
                    <div className="match-row-head">
                      <span className="result-tag">
                        {op.cell_members_won ? 'WIN' : 'LOSS'}
                      </span>
                      <span className={`match-mode${isRotating(resolveMode(op.game_mode, op.queue_id)) ? ' mode-rotating' : ''}`}>
                        {resolveMode(op.game_mode, op.queue_id)}
                      </span>
                      {op.placement != null && (
                        <span className={`match-placement${op.placement === 1 ? ' first' : ''}`}>
                          {formatPlacement(op.placement)} OF 8
                        </span>
                      )}
                      <span className="match-duration">{formatDuration(op.game_duration)}</span>
                      <span className="match-time">{formatTime(op.game_end_timestamp)}</span>
                    </div>
                    <div className="table-scroll">
                    <table className="match-ops">
                      <thead>
                        <tr>
                          <th scope="col">Operator</th>
                          <th scope="col">Champion</th>
                          <th scope="col">KDA</th>
                          <th scope="col" className="col-num">Damage</th>
                          <th scope="col" className="col-num">Gold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...(op.participants ?? [])].sort((a, b) => {
                          // SR games with assigned lanes: top -> jungle -> mid -> bot -> support
                          if (a.role in ROLE_ORDER && b.role in ROLE_ORDER) {
                            return ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
                          }
                          return allOperatorNames.indexOf(a.name) - allOperatorNames.indexOf(b.name)
                        }).map((p, pi) => (
                          <tr key={pi}>
                            <td className={`op-name${p.name === currentUserName ? ' you' : ''}`}>
                              {p.name}
                            </td>
                            <td>{p.champion}</td>
                            <td className="op-kda">{p.kills} / {p.deaths} / {p.assists}</td>
                            <td className="op-dmg col-num">{formatDamage(p.damage)}</td>
                            <td className="op-gold col-num">{formatDamage(p.gold)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <>
              <div className="match-day-header">
                <R w={120} h={10} /> &mdash; <R w={14} h={10} /> DEPLOYMENTS
              </div>
              <RedactedMatchRow />
              <RedactedMatchRow />
              <RedactedMatchRow />

              <div className="match-day-header">
                <R w={120} h={10} /> &mdash; <R w={14} h={10} /> DEPLOYMENTS
              </div>
              <RedactedMatchRow />
              <RedactedMatchRow />

              <div className="match-day-header">
                <R w={120} h={10} /> &mdash; <R w={14} h={10} /> DEPLOYMENTS
              </div>
              <RedactedMatchRow />
              <RedactedMatchRow />
              <RedactedMatchRow />
            </>
          )}
        </div>
      </div>

      <Footer docCode="OPLOG-" office="LEGION/OPS" />
    </>
  )
}
