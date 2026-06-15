import { useNavigate } from 'react-router-dom'
import { useStore, useSnapshot } from '../store/store'
import { entriesForSession, workoutById } from '../lib/selectors'
import { totalVolume } from '../lib/calc'
import { fmtVolume, fmtDate } from '../lib/format'
import { ChevronLeft, ChevronRight } from '../components/Icons'

export default function History() {
  const navigate = useNavigate()
  const snapshot = useSnapshot()

  const sessions = snapshot.sessions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Workouts
        </button>
      </div>

      <h1 className="title" style={{ marginBottom: 16 }}>
        History
      </h1>

      {sessions.length === 0 ? (
        <div className="empty">
          <h3>No sessions yet</h3>
          <p>Once you finish a workout it shows up here.</p>
        </div>
      ) : (
        <div className="stack">
          {sessions.map((s) => {
            const w = workoutById(snapshot, s.workoutId)
            const entries = entriesForSession(snapshot, s.id)
            const vol = totalVolume(entries)
            return (
              <button
                key={s.id}
                className="session-row"
                onClick={() => navigate(`/history/${s.id}`)}
              >
                <div className="sr-main">
                  <div className="sr-name">{w ? w.name : 'Workout'}</div>
                  <div className="sr-meta">
                    {fmtDate(s.date)} · {entries.length} sets · {fmtVolume(vol)} kg
                    {!s.finishedAt && ' · in progress'}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--ink-faint)' }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
