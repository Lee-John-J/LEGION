import { useMemo, useState } from 'react'

/**
 * Campaign Record — season trend chart.
 *
 * X axis is GAME TIME, not calendar time: one step per joint deployment,
 * so the trend line never breaks during idle spells. Idle periods of 7+
 * days re-enter the picture as hatched "dark period" bands whose width
 * scales with the length of the silence (capped so a long break can't
 * dominate the chart). The strip under the axis is the raw record —
 * one tick per game, green win / red loss.
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAY = 86400000
const ROLL_WINDOW = 20
const PLOT_LEFT = 46
const PLOT_RIGHT = 670
const Y = (v) => 16 + (100 - v) * 1.6

function fmtDate(ts) {
  const d = new Date(ts)
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

function buildCampaign(timeline) {
  if (!timeline || timeline.length < 2) return null
  const games = [...timeline].sort((a, b) => a.ts - b.ts)
  const n = games.length

  // Rolling win rate over the last ROLL_WINDOW games (shorter early on)
  let winsInWindow = 0
  const roll = []
  for (let i = 0; i < n; i++) {
    if (games[i].win) winsInWindow++
    if (i >= ROLL_WINDOW && games[i - ROLL_WINDOW].win) winsInWindow--
    roll.push(Math.round((winsInWindow / Math.min(i + 1, ROLL_WINDOW)) * 100))
  }

  // Dark periods: 7+ idle days between consecutive games become a hatched
  // band. Width grows with idle length, capped at 30px.
  const gapAt = {}
  let totalGap = 0
  for (let i = 1; i < n; i++) {
    const idleDays = (games[i].ts - games[i - 1].ts) / DAY
    if (idleDays >= 7) {
      const w = Math.min(30, 6 + Math.floor(idleDays / 7) * 8)
      gapAt[i] = w
      totalGap += w
    }
  }

  const step = (PLOT_RIGHT - PLOT_LEFT - totalGap) / (n - 1)
  const xs = []
  let offset = 0
  for (let i = 0; i < n; i++) {
    if (gapAt[i]) offset += gapAt[i]
    xs.push(PLOT_LEFT + i * step + offset)
  }

  // Month boundaries + labels (labels skipped when the span is too narrow)
  const monthOf = games.map((g) => {
    const d = new Date(g.ts)
    return d.getFullYear() * 12 + d.getMonth()
  })
  const monthBounds = []
  for (let i = 1; i < n; i++) {
    if (monthOf[i] !== monthOf[i - 1]) monthBounds.push((xs[i - 1] + xs[i]) / 2)
  }
  const monthLabels = []
  let spanStart = 0
  for (let i = 1; i <= n; i++) {
    if (i === n || monthOf[i] !== monthOf[spanStart]) {
      const x0 = xs[spanStart], x1 = xs[i - 1]
      if (x1 - x0 >= 18) {
        monthLabels.push({ x: (x0 + x1) / 2, label: MONTHS[new Date(games[spanStart].ts).getMonth()] })
      }
      spanStart = i
    }
  }

  // Longest win run / loss slump
  const best = { W: { len: 0, end: 0 }, L: { len: 0, end: 0 } }
  let runLen = 0, runType = null
  games.forEach((g, i) => {
    const k = g.win ? 'W' : 'L'
    if (k === runType) runLen++
    else { runType = k; runLen = 1 }
    if (runLen > best[k].len) best[k] = { len: runLen, end: i }
  })

  // Peak weekly volume
  const weekCounts = new Map()
  games.forEach((g) => {
    const wk = Math.floor(g.ts / (7 * DAY))
    weekCounts.set(wk, (weekCounts.get(wk) || 0) + 1)
  })
  let peak = { count: 0, wk: null }
  weekCounts.forEach((count, wk) => { if (count > peak.count) peak = { count, wk } })

  // Trend line path — breaks at dark periods, no bridge across them
  let linePath = ''
  for (let i = 0; i < n; i++) {
    const cmd = i === 0 || gapAt[i] ? 'M' : 'L'
    linePath += `${cmd}${xs[i].toFixed(1)},${Y(roll[i]).toFixed(1)} `
  }

  // Win/loss barcode strip — one path per color
  let winTicks = '', lossTicks = ''
  for (let i = 0; i < n; i++) {
    const seg = `M${xs[i].toFixed(1)} 186v10`
    if (games[i].win) winTicks += seg
    else lossTicks += seg
  }

  return {
    games, n, roll, xs, gapAt, monthBounds, monthLabels, best,
    peakVolume: peak.count,
    peakDate: peak.wk != null ? peak.wk * 7 * DAY : null,
    linePath, winTicks, lossTicks,
  }
}

function Annotation({ x, y, color, label }) {
  const above = y > 106
  return (
    <>
      <circle cx={x} cy={y} r={5} fill="none" stroke={color} strokeWidth={1.5} />
      <text
        x={Math.max(80, Math.min(600, x))} y={above ? y - 12 : y + 18}
        textAnchor="middle" fontSize={9} letterSpacing={1} fill={color}
        stroke="var(--card)" strokeWidth={3.5} paintOrder="stroke"
        fontFamily="Courier Prime, monospace"
      >
        {label}
      </text>
    </>
  )
}

export default function CampaignRecord({ timeline }) {
  const [hover, setHover] = useState(null)
  const data = useMemo(() => buildCampaign(timeline), [timeline])

  if (!data) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, marginTop: 20 }}>
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} style={{ height: 20, background: 'var(--ink)', opacity: 0.6, borderRadius: 2 }} />
        ))}
      </div>
    )
  }

  const { games, n, roll, xs, gapAt, monthBounds, monthLabels, best } = data

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (680 / rect.width)
    let nearest = 0, bestDist = Infinity
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xs[i] - mx)
      if (d < bestDist) { bestDist = d; nearest = i }
    }
    setHover(nearest)
  }

  const hoverX = hover != null ? xs[hover] : 0
  const tipAlign = hover != null
    ? (hover > n * 0.75 ? 'translateX(-105%)' : hover < n * 0.15 ? 'translateX(5%)' : 'translateX(-50%)')
    : undefined

  return (
    <div className="cr-wrap">
      <svg
        className="cr-svg" viewBox="0 0 680 228" xmlns="http://www.w3.org/2000/svg"
        role="img" aria-label="Rolling win rate across the season, one step per joint deployment"
        onMouseMove={handleMove} onMouseLeave={() => setHover(null)}
      >
        <defs>
          <pattern id="crHatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--border)" strokeWidth="1.4" />
          </pattern>
        </defs>

        {/* Dark-period bands */}
        {Object.keys(gapAt).map((k) => {
          const i = +k
          return (
            <rect
              key={`gap-${i}`} x={xs[i - 1] + 3} y={12}
              width={Math.max(2, xs[i] - xs[i - 1] - 6)} height={184}
              fill="url(#crHatch)" opacity={0.55}
            />
          )
        })}

        {/* Y gridlines */}
        {[0, 25, 75, 100].map((v) => (
          <g key={`grid-${v}`}>
            <line x1={44} y1={Y(v)} x2={670} y2={Y(v)} stroke="var(--border-light)" strokeWidth={1} />
            <text x={40} y={Y(v) + 3} textAnchor="end" fontSize={9} fill="var(--muted-light)" fontFamily="Courier Prime, monospace">{v}%</text>
          </g>
        ))}
        <line x1={44} y1={Y(50)} x2={670} y2={Y(50)} stroke="var(--slate-2)" strokeWidth={1} strokeDasharray="4 4" />
        <text x={40} y={Y(50) + 3} textAnchor="end" fontSize={9} fill="var(--muted)" fontFamily="Courier Prime, monospace">50%</text>

        {/* Month boundaries + labels */}
        {monthBounds.map((bx, i) => (
          <line key={`mb-${i}`} x1={bx} y1={12} x2={bx} y2={198} stroke="var(--border-light)" strokeWidth={1} />
        ))}
        {monthLabels.map((m, i) => (
          <text
            key={`ml-${i}`} x={m.x} y={216} textAnchor="middle" fontSize={9}
            letterSpacing={2} fill="var(--muted)" fontFamily="Courier Prime, monospace"
          >
            {m.label}
          </text>
        ))}

        {/* Trend line + win/loss strip */}
        <path d={data.linePath} fill="none" stroke="var(--text)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={data.winTicks} stroke="var(--green)" strokeWidth={2.2} fill="none" />
        <path d={data.lossTicks} stroke="var(--red)" strokeWidth={2.2} fill="none" />

        {/* Streak annotations */}
        {best.L.len >= 3 && (
          <Annotation x={xs[best.L.end]} y={Y(roll[best.L.end])} color="var(--red)" label={`${best.L.len}L SLUMP`} />
        )}
        {best.W.len >= 3 && (
          <Annotation x={xs[best.W.end]} y={Y(roll[best.W.end])} color="var(--green)" label={`${best.W.len}W RUN`} />
        )}

        {/* Hover crosshair */}
        {hover != null && (
          <line x1={hoverX} y1={12} x2={hoverX} y2={198} stroke="var(--text)" strokeWidth={1} strokeDasharray="3 3" />
        )}
      </svg>

      {hover != null && (
        <div className="cr-tip" style={{ left: `${(hoverX / 680) * 100}%`, transform: tipAlign }}>
          <strong>GAME {hover + 1} &mdash; {fmtDate(games[hover].ts)}</strong><br />
          {games[hover].win ? 'WIN' : 'LOSS'} &middot; ROLLING {roll[hover]}%
        </div>
      )}

      <div className="cr-records">
        <span>RECORDS:</span>
        {best.W.len > 0 && (
          <span>BEST RUN <strong style={{ color: 'var(--green)' }}>{best.W.len}W</strong> ({fmtDate(games[best.W.end].ts)})</span>
        )}
        {best.L.len > 0 && (
          <span>WORST SLUMP <strong style={{ color: 'var(--red)' }}>{best.L.len}L</strong> ({fmtDate(games[best.L.end].ts)})</span>
        )}
        {data.peakVolume > 0 && data.peakDate != null && (
          <span>PEAK VOLUME <strong>{data.peakVolume}/WK</strong> ({fmtDate(data.peakDate)})</span>
        )}
      </div>
    </div>
  )
}
