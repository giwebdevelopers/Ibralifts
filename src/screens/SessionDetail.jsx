import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useSnapshot } from '../store/store'
import {
  sessionById,
  workoutById,
  entriesForSession,
  entriesForExerciseInSession,
} from '../lib/selectors'
import { totalVolume } from '../lib/calc'
import { fmtVolume, fmtDate, fmtWeight } from '../lib/format'
import ProgressSheet from '../components/ProgressSheet'
import { ChevronLeft, Trash, ChevronRight, Play } from '../components/Icons'

export default function SessionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const snapshot = useSnapshot()
  const deleteSession = useStore((s) => s.deleteSession)
  const startSession = useStore((s) => s.startSession)
  const [progressExercise, setProgressExercise] = useState(null)

  const session = sessionById(snapshot, id)
  if (!session) {
    return (
      <div className="screen">
        <div className="empty">
          <h3>Session not found</h3>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => navigate('/history')}>
            Back to history
          </button>
        </div>
      </div>
    )
  }

  const workout = workoutById(snapshot, session.workoutId)
  const entries = entriesForSession(snapshot, session.id)
  const vol = totalVolume(entries)
  const exerciseIds = [...new Set(entries.map((e) => e.exerciseId))]

  async function resume() {
    if (!session.finishedAt) {
      navigate(`/session/${session.id}`)
      return
    }
    if (workout) {
      const newId = await startSession(workout.id)
      if (newId) navigate(`/session/${newId}`)
    }
  }

  async function remove() {
    if (!confirm('Delete this session permanently?')) return
    await deleteSession(session.id)
    navigate('/history')
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={() => navigate('/history')}>
          <ChevronLeft size={20} /> History
        </button>
      </div>

      <div className="row" style={{ alignItems: 'baseline', marginBottom: 4 }}>
        <h1 className="title" style={{ flex: 1 }}>
          {workout ? workout.name : 'Workout'}
        </h1>
      </div>
      <div className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        {fmtDate(session.date)} · {entries.length} sets · {fmtVolume(vol)} kg
        {!session.finishedAt && ' · in progress'}
      </div>

      <div className="stack">
        {exerciseIds.map((eid) => {
          const ex = snapshot.exercises.find((e) => e.id === eid)
          const sets = entriesForExerciseInSession(snapshot, session.id, eid)
          return (
            <div className="exercise" key={eid}>
              <button
                className="exercise-head"
                onClick={() => ex && setProgressExercise(ex)}
              >
                <span className="name">{ex ? ex.name : 'Exercise'}</span>
                <ChevronRight className="chevron" size={18} />
              </button>
              <div className="detail-sets">
                {sets.map((s) => (
                  <div className="detail-set" key={s.id}>
                    <span className="ds-num">{s.setNumber}</span>
                    <span className="ds-main tnum">
                      {fmtWeight(s.weight)} kg × {s.reps}
                    </span>
                    {s.rpe != null && <span className="ds-rpe">RPE {s.rpe}</span>}
                    {s.note ? <span className="ds-note">{s.note}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={resume}>
        <Play size={17} /> {session.finishedAt ? 'Repeat this workout' : 'Resume session'}
      </button>

      <button className="btn btn-danger btn-block" style={{ marginTop: 12 }} onClick={remove}>
        <Trash size={18} /> Delete session
      </button>

      <ProgressSheet exercise={progressExercise} onClose={() => setProgressExercise(null)} />
    </div>
  )
}
