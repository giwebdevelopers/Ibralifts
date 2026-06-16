// ---------------------------------------------------------------------------
// Read-only queries over the in-memory dataset. `state` is the plain shape
// { exercises, workouts, sessions, setEntries }.
// ---------------------------------------------------------------------------

import { topSet, setVolume } from './calc'

export function exerciseById(state, id) {
  return state.exercises.find((e) => e.id === id) || null
}

export function workoutById(state, id) {
  return state.workouts.find((w) => w.id === id) || null
}

export function sessionById(state, id) {
  return state.sessions.find((s) => s.id === id) || null
}

// Sessions for a workout, newest first.
export function sessionsForWorkout(state, workoutId) {
  return state.sessions
    .filter((s) => s.workoutId === workoutId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

// The most recent session for a workout, optionally excluding one id.
export function lastSessionForWorkout(state, workoutId, excludeId = null) {
  return (
    sessionsForWorkout(state, workoutId).find((s) => s.id !== excludeId) || null
  )
}

// All set entries for a session.
export function entriesForSession(state, sessionId) {
  return state.setEntries.filter((s) => s.sessionId === sessionId)
}

// Set entries for one exercise within a session, ordered by set number.
export function entriesForExerciseInSession(state, sessionId, exerciseId) {
  return state.setEntries
    .filter((s) => s.sessionId === sessionId && s.exerciseId === exerciseId)
    .sort((a, b) => a.setNumber - b.setNumber)
}

// The previous session's sets for a given exercise — the comparison baseline.
// Prefers the previous session of the *same workout*; falls back to the most
// recent earlier session anywhere that included this exercise (covers newly
// added exercises). Returns [] when there is no history.
export function previousEntriesForExercise(state, { workoutId, exerciseId, currentSessionId, currentDate }) {
  const cutoff = currentDate ? new Date(currentDate).getTime() : Infinity

  const earlierSessions = state.sessions
    .filter((s) => s.id !== currentSessionId && new Date(s.date).getTime() <= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Pass 1: same workout.
  for (const s of earlierSessions) {
    if (s.id === currentSessionId) continue
    if (s.workoutId !== workoutId) continue
    const sets = entriesForExerciseInSession(state, s.id, exerciseId)
    if (sets.length) return { session: s, sets }
  }
  // Pass 2: any workout.
  for (const s of earlierSessions) {
    const sets = entriesForExerciseInSession(state, s.id, exerciseId)
    if (sets.length) return { session: s, sets }
  }
  return { session: null, sets: [] }
}

// History of an exercise's top-set weight over time, oldest first.
// Used by the per-exercise progress chart.
export function exerciseHistory(state, exerciseId) {
  const points = []
  for (const session of state.sessions) {
    const sets = entriesForExerciseInSession(state, session.id, exerciseId)
    if (!sets.length) continue
    const ts = topSet(sets)
    points.push({
      date: session.date,
      weight: Number(ts.weight) || 0,
      reps: Number(ts.reps) || 0,
      volume: sets.reduce((sum, s) => sum + setVolume(s), 0),
    })
  }
  return points.sort((a, b) => new Date(a.date) - new Date(b.date))
}

// Recent sessions that included a given exercise, newest first, each with its
// top set. Powers the per-exercise history dropdown ("when did I last do this
// and how much"). Looks across all workouts the exercise appears in.
export function exerciseRecentSessions(state, exerciseId, { excludeSessionId = null, limit = 6 } = {}) {
  const out = []
  const sessions = state.sessions
    .filter((s) => s.id !== excludeSessionId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  for (const session of sessions) {
    const sets = entriesForExerciseInSession(state, session.id, exerciseId)
    if (!sets.length) continue
    out.push({ session, sets, top: topSet(sets) })
    if (out.length >= limit) break
  }
  return out
}

// Distinct exercise ids that appear anywhere in history (for "have I done this").
export function exercisesUsed(state) {
  const ids = new Set(state.setEntries.map((s) => s.exerciseId))
  return state.exercises.filter((e) => ids.has(e.id))
}
