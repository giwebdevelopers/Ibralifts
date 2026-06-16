import { useNavigate } from 'react-router-dom'
import { useStore, useSnapshot } from '../store/store'
import { sessionsForWorkout } from '../lib/selectors'
import { relativeDay } from '../lib/format'
import { Settings, ChevronRight, Edit, Plus, Dumbbell } from '../components/Icons'

export default function Home() {
  const navigate = useNavigate()
  const workouts = useStore((s) => s.workouts)
  const snapshot = useSnapshot()
  const startSession = useStore((s) => s.startSession)

  async function start(workoutId) {
    const id = await startSession(workoutId)
    if (id) navigate(`/session/${id}`)
  }

  const sorted = workouts
    .slice()
    .sort((a, b) => {
      const la = sessionsForWorkout(snapshot, a.id)[0]
      const lb = sessionsForWorkout(snapshot, b.id)[0]
      const ta = la ? new Date(la.date).getTime() : 0
      const tb = lb ? new Date(lb.date).getTime() : 0
      return tb - ta || a.name.localeCompare(b.name)
    })

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 className="title">ibralifts</h1>
        </div>
        <button className="iconbtn" aria-label="History" onClick={() => navigate('/history')}>
          <Dumbbell size={21} />
        </button>
        <button className="iconbtn" aria-label="Settings" onClick={() => navigate('/settings')}>
          <Settings size={21} />
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="empty">
          <h3>No workouts yet</h3>
          <p>Create a workout like Push, Pull or Legs, then add your exercises.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 18 }}
            onClick={() => navigate('/workout/new')}
          >
            <Plus size={18} /> New workout
          </button>
        </div>
      ) : (
        <>
          <div className="section-label">Workouts</div>
          <div className="stack stagger">
            {sorted.map((w) => {
              const last = sessionsForWorkout(snapshot, w.id)[0]
              const meta = [
                `${w.exerciseIds.length} exercise${w.exerciseIds.length === 1 ? '' : 's'}`,
                last ? relativeDay(last.date) : 'Never done',
              ].join(' · ')
              return (
                <div className="workout-card" key={w.id}>
                  <button
                    className="wc-main"
                    onClick={() => start(w.id)}
                    aria-label={`Start ${w.name}`}
                  >
                    <div className="wc-name">{w.name}</div>
                    <div className="wc-meta">{meta}</div>
                  </button>
                  <button
                    className="iconbtn"
                    aria-label={`Edit ${w.name}`}
                    onClick={() => navigate(`/workout/${w.id}/edit`)}
                  >
                    <Edit size={19} />
                  </button>
                  <span className="wc-go" aria-hidden>
                    <ChevronRight size={20} />
                  </span>
                </div>
              )
            })}
          </div>

          <button
            className="btn btn-ghost btn-block"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/workout/new')}
          >
            <Plus size={18} /> New workout
          </button>
        </>
      )}
    </div>
  )
}
