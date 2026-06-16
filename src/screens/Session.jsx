import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useSnapshot } from '../store/store'
import {
  sessionById,
  workoutById,
  entriesForSession,
  entriesForExerciseInSession,
  previousEntriesForExercise,
  lastSessionForWorkout,
  exerciseRecentSessions,
} from '../lib/selectors'
import { totalVolume, compareValue, bestWeight } from '../lib/calc'
import { fmtVolume, fmtSigned, relativeDay } from '../lib/format'
import ExerciseCard from '../components/ExerciseCard'
import ProgressSheet from '../components/ProgressSheet'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'
import DiffIndicator from '../components/DiffIndicator'
import Sheet from '../components/Sheet'
import { useRestTimer } from '../components/RestTimer'
import { toast } from '../components/Toast'
import { ChevronLeft, Check, Plus } from '../components/Icons'

export default function Session() {
  const navigate = useNavigate()
  const { id } = useParams()
  const snapshot = useSnapshot()
  const settings = useStore((s) => s.settings)

  const addSet = useStore((s) => s.addSet)
  const addDropSet = useStore((s) => s.addDropSet)
  const updateSet = useStore((s) => s.updateSet)
  const deleteSet = useStore((s) => s.deleteSet)
  const finishSession = useStore((s) => s.finishSession)
  const addExerciseToWorkout = useStore((s) => s.addExerciseToWorkout)
  const startRest = useRestTimer((s) => s.start)

  const [progressExercise, setProgressExercise] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  const session = sessionById(snapshot, id)
  const workout = session ? workoutById(snapshot, session.workoutId) : null

  // Ordered list of exercises to show: template order first, then any extra
  // exercises that have entries in this session (added ad hoc).
  const exerciseList = useMemo(() => {
    if (!session || !workout) return []
    const order = [...workout.exerciseIds]
    const inSession = new Set(
      entriesForSession(snapshot, session.id).map((e) => e.exerciseId)
    )
    for (const eid of inSession) if (!order.includes(eid)) order.push(eid)
    return order
      .map((eid) => snapshot.exercises.find((e) => e.id === eid))
      .filter(Boolean)
  }, [snapshot, session, workout])

  const curEntries = session ? entriesForSession(snapshot, session.id) : []
  const prevSession = session
    ? lastSessionForWorkout(snapshot, session.workoutId, session.id)
    : null

  const curVolume = totalVolume(curEntries)
  const prevVolume = prevSession
    ? totalVolume(entriesForSession(snapshot, prevSession.id))
    : null
  const volDiff = compareValue(curVolume, prevVolume)
  const totalSets = curEntries.length

  if (!session || !workout) {
    return (
      <div className="screen">
        <div className="empty">
          <h3>Session not found</h3>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => navigate('/')}>
            Back home
          </button>
        </div>
      </div>
    )
  }

  function applyNudge(exerciseId, toWeight) {
    const sets = entriesForExerciseInSession(snapshot, session.id, exerciseId)
    sets.forEach((s) => updateSet(s.id, { weight: toWeight }))
    toast(`Bumped to ${toWeight} kg`)
  }

  async function addExerciseLive(ex) {
    await addExerciseToWorkout(session.workoutId, ex.id)
    await addSet(session.id, ex.id)
    setAddOpen(false)
  }

  async function finish() {
    await finishSession(session.id)
    toast('Session saved')
    navigate('/')
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Workouts
        </button>
      </div>

      <div className="row" style={{ alignItems: 'baseline', marginBottom: 14 }}>
        <h1 className="title" style={{ flex: 1 }}>
          {workout.name}
        </h1>
        <span className="muted" style={{ fontSize: 14 }}>
          {relativeDay(session.date)}
        </span>
      </div>

      {/* Session summary */}
      <div className="summary">
        <div className="stat">
          <div className="k">Volume</div>
          <div className="v tnum">
            {fmtVolume(curVolume)}
            <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>kg</span>
          </div>
        </div>
        <div className="stat">
          <div className="k">vs last time</div>
          <div className="v">
            {prevVolume == null ? (
              <span className="faint" style={{ fontSize: 15 }}>
                First session
              </span>
            ) : (
              <DiffIndicator
                dir={volDiff.dir}
                size={16}
                label={volDiff.dir === 'same' ? 'matched' : fmtSigned(volDiff.delta, ' kg')}
              />
            )}
          </div>
        </div>
        <div className="stat">
          <div className="k">Sets</div>
          <div className="v tnum">{totalSets}</div>
        </div>
      </div>

      {/* Exercises */}
      <div className="stack stagger" style={{ marginTop: 16 }}>
        {exerciseList.map((ex) => {
          const sets = entriesForExerciseInSession(snapshot, session.id, ex.id)
          const prev = previousEntriesForExercise(snapshot, {
            workoutId: session.workoutId,
            exerciseId: ex.id,
            currentSessionId: session.id,
            currentDate: session.date,
          })
          // Best weight ever for PR detection, excluding this session.
          const priorBest = bestWeight(
            snapshot.setEntries.filter((s) => s.sessionId !== session.id),
            ex.id
          )
          const history = exerciseRecentSessions(snapshot, ex.id, {
            excludeSessionId: session.id,
            limit: 6,
          })
          return (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              sets={sets}
              prevSets={prev.sets}
              prevSession={prev.session}
              history={history}
              priorBest={priorBest}
              repGoal={settings.repGoal}
              onAddSet={(eid) => addSet(session.id, eid)}
              onAddDropSet={(eid) => addDropSet(session.id, eid)}
              onUpdateSet={updateSet}
              onDeleteSet={deleteSet}
              onOpenProgress={setProgressExercise}
              onStartRest={() => startRest(settings.restSeconds)}
              onApplyNudge={applyNudge}
            />
          )
        })}
      </div>

      {exerciseList.length === 0 && (
        <div className="empty">
          <h3>No exercises yet</h3>
          <p>Add an exercise to start logging.</p>
        </div>
      )}

      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: 16 }}
        onClick={() => setAddOpen(true)}
      >
        <Plus size={18} /> Add exercise
      </button>

      <div className="footer-action">
        <div className="app-inner">
          <button className="btn btn-primary btn-block" onClick={finish}>
            <Check size={18} /> Finish session
          </button>
        </div>
      </div>

      <ProgressSheet exercise={progressExercise} onClose={() => setProgressExercise(null)} />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add exercise">
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Adds it to this session and to the {workout.name} workout.
        </p>
        <ExerciseAutocomplete onSelect={addExerciseLive} excludeIds={workout.exerciseIds} autoFocus />
      </Sheet>
    </div>
  )
}
