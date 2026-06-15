import { fmtWeight, fmtDateShort } from '../lib/format'

// Minimal line chart of a single series. Honest straight segments, one accent
// colour, a soft area fill, and only the labels that earn their place.
export default function LineChart({ points, height = 180 }) {
  const W = 320
  const H = height
  const padL = 34
  const padR = 12
  const padT = 16
  const padB = 26

  if (!points || points.length === 0) {
    return <div className="empty" style={{ padding: '28px 0' }}>No data yet.</div>
  }

  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const weights = points.map((p) => p.weight)
  const dataMin = Math.min(...weights)
  const dataMax = Math.max(...weights)
  // Padded bounds drive the scale; the real data min/max drive the labels.
  let min, max
  if (dataMin === dataMax) {
    min = Math.max(0, dataMin - 5)
    max = dataMax + 5
  } else {
    const pad = (dataMax - dataMin) * 0.18
    min = Math.max(0, dataMin - pad)
    max = dataMax + pad
  }

  const n = points.length
  const x = (i) => (n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW)
  const y = (w) => padT + innerH - ((w - min) / (max - min || 1)) * innerH

  const linePts = points.map((p, i) => `${x(i)},${y(p.weight)}`).join(' ')
  const areaPts = `${padL},${padT + innerH} ${linePts} ${x(n - 1)},${padT + innerH}`

  const last = points[n - 1]

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Top set weight over time">
        {/* horizontal guide lines + labels at the real data min/max */}
        <line className="grid-line" x1={padL} y1={y(dataMax)} x2={W - padR} y2={y(dataMax)} />
        <line className="grid-line" x1={padL} y1={y(dataMin)} x2={W - padR} y2={y(dataMin)} />

        <text className="axis-label" x={padL - 6} y={y(dataMax) + 4} textAnchor="end">
          {fmtWeight(dataMax)}
        </text>
        {dataMin !== dataMax && (
          <text className="axis-label" x={padL - 6} y={y(dataMin) + 4} textAnchor="end">
            {fmtWeight(dataMin)}
          </text>
        )}

        {n > 1 && <polygon className="chart-area" points={areaPts} />}
        {n > 1 && <polyline className="series" points={linePts} />}

        {points.map((p, i) => (
          <circle
            key={i}
            className={i === n - 1 ? 'dot dot-last' : 'dot'}
            cx={x(i)}
            cy={y(p.weight)}
            r={i === n - 1 ? 4.5 : 3}
          />
        ))}

        {/* x labels: first + last date */}
        <text className="axis-label" x={x(0)} y={H - 8} textAnchor="start">
          {fmtDateShort(points[0].date)}
        </text>
        {n > 1 && (
          <text className="axis-label" x={x(n - 1)} y={H - 8} textAnchor="end">
            {fmtDateShort(last.date)}
          </text>
        )}
      </svg>
    </div>
  )
}
