import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/store'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'
import { ChevronLeft, ChevronDown, ChevronRight, X, Trash } from '../components/Icons'

export default function WorkoutEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const workouts = useStore((s) => s.workouts)
  const exercises = useStore((s) => s.exercises)
  const createWorkout = useStore((s) => s.createWorkout)
  const updateWorkout = useStore((s) => s.updateWorkout)
  const deleteWorkout = useStore((s) => s.deleteWorkout)

  const existing = id ? workouts.find((w) => w.id === id) : null
  const [name, setName] = useState(existing?.name || '')
  const [exerciseIds, setExerciseIds] = useState(existing ? [...existing.exerciseIds] : [])

  const nameById = (eid) => exercises.find((e) => e.id === eid)?.name || 'Exercise'

  function addExercise(ex) {
    setExerciseIds((ids) => (ids.includes(ex.id) ? ids : [...ids, ex.id]))
  }
  function removeExercise(eid) {
    setExerciseIds((ids) => ids.filter((x) => x !== eid))
  }
  function move(eid, dir) {
    setExerciseIds((ids) => {
      const i = ids.indexOf(eid)
      const j = i + dir
      if (i < 0 || j < 0 || j >= ids.length) return ids
      const next = ids.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  async function save() {
    const clean = name.trim()
    if (!clean) return
    if (existing) {
      await updateWorkout(existing.id, { name: clean, exerciseIds })
    } else {
      const w = await createWorkout(clean)
      await updateWorkout(w.id, { exerciseIds })
    }
    navigate('/')
  }

  async function remove() {
    if (!existing) return
    if (!confirm(`Delete "${existing.name}"? Your logged sessions stay in history.`)) return
    await deleteWorkout(existing.id)
    navigate('/')
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back
        </button>
      </div>

      <h1 className="title" style={{ marginBottom: 16 }}>
        {existing ? 'Edit workout' : 'New workout'}
      </h1>

      <div className="section-label" style={{ marginTop: 0 }}>
        Name
      </div>
      <input
        className="field"
        placeholder="Push, Pull, Legs…"
        value={name}
        autoFocus={!existing}
        autoCapitalize="words"
        onChange={(e) => setName(e.target.value)}
      />

      <div className="section-label">Exercises</div>
      {exerciseIds.length === 0 ? (
        <p className="muted" style={{ fontSize: 14, margin: '0 2px 12px' }}>
          Add the exercises you do in this workout, in order.
        </p>
      ) : (
        <div className="stack" style={{ marginBottom: 12 }}>
          {exerciseIds.map((eid, i) => (
            <div className="reorder-row" key={eid}>
              <span className="ro-name">{nameById(eid)}</span>
              <button
                className="iconbtn sm"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => move(eid, -1)}
              >
                <ChevronDown size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button
                className="iconbtn sm"
                aria-label="Move down"
                disabled={i === exerciseIds.length - 1}
                onClick={() => move(eid, 1)}
              >
                <ChevronDown size={18} />
              </button>
              <button
                className="iconbtn sm"
                aria-label="Remove"
                onClick={() => removeExercise(eid)}
                style={{ color: 'var(--down)' }}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ExerciseAutocomplete onSelect={addExercise} excludeIds={exerciseIds} />

      {existing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 28 }} onClick={remove}>
          <Trash size={18} /> Delete workout
        </button>
      )}

      <div className="footer-action">
        <div className="app-inner">
          <button className="btn btn-primary btn-block" disabled={!name.trim()} onClick={save}>
            {existing ? 'Save changes' : 'Create workout'}
          </button>
        </div>
      </div>
    </div>
  )
}
