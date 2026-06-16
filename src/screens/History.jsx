import { useNavigate } from 'react-router-dom'
import { useSnapshot } from '../store/store'
import { entriesForSession, workoutById } from '../lib/selectors'
import { totalVolume } from '../lib/calc'
import { fmtVolume, fmtWeekdayDay, monthLabel } from '../lib/format'
import { ChevronLeft, ChevronRight } from '../components/Icons'

export default function History() {
  const navigate = useNavigate()
  const snapshot = useSnapshot()

  const sessions = snapshot.sessions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Group sessions into months (newest first), preserving order.
  const months = []
  let current = null
  for (const s of sessions) {
    const label = monthLabel(s.date)
    if (!current || current.label !== label) {
      current = { label, sessions: [] }
      months.push(current)
    }
    current.sessions.push(s)
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Workouts
        </button>
      </div>

      <h1 className="title" style={{ marginBottom: 8 }}>
        History
      </h1>

      {sessions.length === 0 ? (
        <div className="empty">
          <h3>No sessions yet</h3>
          <p>Once you finish a workout it shows up here.</p>
        </div>
      ) : (
        months.map((month) => (
          <div key={month.label}>
            <div className="section-label">{month.label}</div>
            <div className="stack stagger">
              {month.sessions.map((s) => {
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
                        {fmtWeekdayDay(s.date)} · {entries.length} sets · {fmtVolume(vol)} kg
                        {!s.finishedAt && ' · in progress'}
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: 'var(--ink-faint)' }} />
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
