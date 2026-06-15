import Sheet from './Sheet'
import LineChart from './LineChart'
import { useSnapshot } from '../store/store'
import { exerciseHistory } from '../lib/selectors'
import { bestWeight, estimate1RM } from '../lib/calc'
import { fmtKg } from '../lib/format'

// Per-exercise progress: a clean line of top-set weight over time plus a few
// honest numbers. Opens as a bottom sheet.
export default function ProgressSheet({ exercise, onClose }) {
  const snapshot = useSnapshot()
  if (!exercise) return null

  const points = exerciseHistory(snapshot, exercise.id)
  const best = bestWeight(snapshot.setEntries, exercise.id)
  const best1RM = points.reduce((m, p) => Math.max(m, estimate1RM(p.weight, p.reps)), 0)

  return (
    <Sheet open={!!exercise} onClose={onClose} title={exercise.name}>
      <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        Top set weight over time
      </div>

      <LineChart points={points} />

      <div className="summary" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="k">Best weight</div>
          <div className="v tnum">{best > 0 ? fmtKg(best) : '—'}</div>
        </div>
        <div className="stat">
          <div className="k">Est. 1RM</div>
          <div className="v tnum">{best1RM > 0 ? fmtKg(Math.round(best1RM * 2) / 2) : '—'}</div>
        </div>
        <div className="stat">
          <div className="k">Sessions</div>
          <div className="v tnum">{points.length}</div>
        </div>
      </div>

      <button className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={onClose}>
        Close
      </button>
    </Sheet>
  )
}
