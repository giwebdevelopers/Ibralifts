import { useMemo } from 'react'
import { create } from 'zustand'
import * as db from '../db/db'
import { uid } from '../lib/id'
import { DEFAULT_REP_GOAL, nextDropDefault } from '../lib/calc'
import {
  lastSessionForWorkout,
  entriesForExerciseInSession,
  entriesForSession,
  previousEntriesForExercise,
} from '../lib/selectors'

const DEFAULT_REPS = 8
const DEFAULT_WEIGHT = 20

const SETTINGS_KEY = 'ibralifts.settings.v1'
const DEFAULT_SETTINGS = { repGoal: DEFAULT_REP_GOAL, restSeconds: 120, restSound: true }

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

// Fire-and-forget IndexedDB write for hot-path mutations: the in-memory store
// is updated synchronously (instant UI) and the write happens in the background.
function persist(promise) {
  Promise.resolve(promise).catch((e) => console.error('ibralifts: persist failed', e))
}

// Reassign contiguous set numbers (1..n) to a list ordered as given.
function renumber(sets) {
  return sets
    .slice()
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((s, i) => ({ ...s, setNumber: i + 1 }))
}

export const useStore = create((set, get) => ({
  ready: false,
  exercises: [],
  workouts: [],
  sessions: [],
  setEntries: [],
  settings: loadSettings(),

  // -- lifecycle ----------------------------------------------------------
  async init() {
    const data = await db.loadAll()
    set({ ...data, ready: true })
  },

  snapshot() {
    const { exercises, workouts, sessions, setEntries } = get()
    return { exercises, workouts, sessions, setEntries }
  },

  // -- exercises ----------------------------------------------------------
  // Return an existing exercise (case-insensitive) or create a new one.
  async findOrCreateExercise(name) {
    const clean = name.trim()
    if (!clean) return null
    const existing = get().exercises.find(
      (e) => e.name.toLowerCase() === clean.toLowerCase()
    )
    if (existing) return existing
    const ex = { id: uid(), name: clean, createdAt: new Date().toISOString() }
    await db.put('exercises', ex)
    set((s) => ({ exercises: [...s.exercises, ex] }))
    return ex
  },

  async renameExercise(id, name) {
    const clean = name.trim()
    if (!clean) return
    const ex = get().exercises.find((e) => e.id === id)
    if (!ex) return
    const updated = { ...ex, name: clean }
    await db.put('exercises', updated)
    set((s) => ({ exercises: s.exercises.map((e) => (e.id === id ? updated : e)) }))
  },

  // -- workouts -----------------------------------------------------------
  async createWorkout(name) {
    const w = {
      id: uid(),
      name: name.trim() || 'Workout',
      exerciseIds: [],
      createdAt: new Date().toISOString(),
    }
    await db.put('workouts', w)
    set((s) => ({ workouts: [...s.workouts, w] }))
    return w
  },

  async updateWorkout(id, patch) {
    const w = get().workouts.find((x) => x.id === id)
    if (!w) return
    const updated = { ...w, ...patch }
    await db.put('workouts', updated)
    set((s) => ({ workouts: s.workouts.map((x) => (x.id === id ? updated : x)) }))
    return updated
  },

  async addExerciseToWorkout(workoutId, exerciseId) {
    const w = get().workouts.find((x) => x.id === workoutId)
    if (!w || w.exerciseIds.includes(exerciseId)) return
    return get().updateWorkout(workoutId, { exerciseIds: [...w.exerciseIds, exerciseId] })
  },

  async removeExerciseFromWorkout(workoutId, exerciseId) {
    const w = get().workouts.find((x) => x.id === workoutId)
    if (!w) return
    return get().updateWorkout(workoutId, {
      exerciseIds: w.exerciseIds.filter((id) => id !== exerciseId),
    })
  },

  async reorderWorkoutExercises(workoutId, exerciseIds) {
    return get().updateWorkout(workoutId, { exerciseIds })
  },

  async deleteWorkout(id) {
    await db.del('workouts', id)
    set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }))
  },

  // -- sessions (the core loop) ------------------------------------------
  // Start today's session for a workout. If an unfinished session already
  // exists for it, resume that. Otherwise create a fresh session pre-filled
  // with exactly what was lifted last time ("repeat last").
  async startSession(workoutId) {
    const state = get()
    const w = state.workouts.find((x) => x.id === workoutId)
    if (!w) return null

    // Resume an in-progress session if present.
    const inProgress = state.sessions
      .filter((s) => s.workoutId === workoutId && !s.finishedAt)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    if (inProgress) return inProgress.id

    const now = new Date().toISOString()
    const session = { id: uid(), workoutId, date: now, finishedAt: null }

    const snap = get().snapshot()
    const newEntries = []
    for (const exerciseId of w.exerciseIds) {
      const { sets: prevSets } = previousEntriesForExercise(snap, {
        workoutId,
        exerciseId,
        currentSessionId: session.id,
        currentDate: now,
      })
      if (prevSets.length) {
        // Copy each previous set's numbers exactly (including any drop set
        // structure); clear per-set notes/RPE.
        prevSets.forEach((p, i) => {
          newEntries.push({
            id: uid(),
            sessionId: session.id,
            exerciseId,
            setNumber: i + 1,
            weight: Number(p.weight) || 0,
            reps: Number(p.reps) || 0,
            drops:
              Array.isArray(p.drops) && p.drops.length
                ? p.drops.map((d) => ({ weight: Number(d.weight) || 0, reps: Number(d.reps) || 0 }))
                : null,
            rpe: null,
            note: '',
          })
        })
      } else {
        // No history for this exercise: one sensible default set.
        newEntries.push({
          id: uid(),
          sessionId: session.id,
          exerciseId,
          setNumber: 1,
          weight: DEFAULT_WEIGHT,
          reps: state.settings.repGoal || DEFAULT_REPS,
          drops: null,
          rpe: null,
          note: '',
        })
      }
    }

    await db.put('sessions', session)
    if (newEntries.length) await db.bulkPut('setEntries', newEntries)
    set((s) => ({
      sessions: [...s.sessions, session],
      setEntries: [...s.setEntries, ...newEntries],
    }))
    return session.id
  },

  addSet(sessionId, exerciseId) {
    const snap = get().snapshot()
    const existing = entriesForExerciseInSession(snap, sessionId, exerciseId)
    const last = existing[existing.length - 1]
    const entry = {
      id: uid(),
      sessionId,
      exerciseId,
      setNumber: existing.length + 1,
      weight: last ? Number(last.weight) || 0 : DEFAULT_WEIGHT,
      reps: last ? Number(last.reps) || 0 : get().settings.repGoal || DEFAULT_REPS,
      drops: null,
      rpe: null,
      note: '',
    }
    // Optimistic: memory first (instant UI), persist in the background.
    set((s) => ({ setEntries: [...s.setEntries, entry] }))
    persist(db.put('setEntries', entry))
    return entry
  },

  // Add a drop set: a working set (copied from the last set, like addSet) plus
  // two pre-filled drops that step down. The user adjusts/extends from there.
  addDropSet(sessionId, exerciseId) {
    const snap = get().snapshot()
    const existing = entriesForExerciseInSession(snap, sessionId, exerciseId)
    const last = existing[existing.length - 1]
    const baseWeight = last ? Number(last.weight) || 0 : DEFAULT_WEIGHT
    const baseReps = last ? Number(last.reps) || 0 : get().settings.repGoal || DEFAULT_REPS
    const d1 = nextDropDefault(baseWeight, baseReps)
    const d2 = nextDropDefault(d1.weight, d1.reps)
    const entry = {
      id: uid(),
      sessionId,
      exerciseId,
      setNumber: existing.length + 1,
      weight: baseWeight,
      reps: baseReps,
      drops: [d1, d2],
      rpe: null,
      note: '',
    }
    set((s) => ({ setEntries: [...s.setEntries, entry] }))
    persist(db.put('setEntries', entry))
    return entry
  },

  updateSet(setId, patch) {
    const cur = get().setEntries.find((s) => s.id === setId)
    if (!cur) return
    const updated = { ...cur, ...patch }
    // Optimistic: memory first so the Stepper hold and every tap feel instant;
    // persist in the background.
    set((s) => ({ setEntries: s.setEntries.map((x) => (x.id === setId ? updated : x)) }))
    persist(db.put('setEntries', updated))
    return updated
  },

  async deleteSet(setId) {
    const cur = get().setEntries.find((s) => s.id === setId)
    if (!cur) return
    await db.del('setEntries', setId)
    // Renumber remaining sets for that exercise in that session.
    const siblings = get()
      .setEntries.filter(
        (s) => s.id !== setId && s.sessionId === cur.sessionId && s.exerciseId === cur.exerciseId
      )
    const renumbered = renumber(siblings)
    await db.bulkPut('setEntries', renumbered)
    set((s) => ({
      setEntries: s.setEntries
        .filter((x) => x.id !== setId)
        .map((x) => renumbered.find((r) => r.id === x.id) || x),
    }))
  },

  async finishSession(sessionId) {
    const sess = get().sessions.find((s) => s.id === sessionId)
    if (!sess) return
    const updated = { ...sess, finishedAt: new Date().toISOString() }
    await db.put('sessions', updated)
    set((s) => ({ sessions: s.sessions.map((x) => (x.id === sessionId ? updated : x)) }))
  },

  async deleteSession(sessionId) {
    const snap = get().snapshot()
    const entryIds = entriesForSession(snap, sessionId).map((e) => e.id)
    await db.bulkDelete('setEntries', entryIds)
    await db.del('sessions', sessionId)
    set((s) => ({
      sessions: s.sessions.filter((x) => x.id !== sessionId),
      setEntries: s.setEntries.filter((x) => x.sessionId !== sessionId),
    }))
  },

  // -- settings -----------------------------------------------------------
  setSettings(patch) {
    const next = { ...get().settings, ...patch }
    saveSettings(next)
    set({ settings: next })
  },

  // -- backup / restore ---------------------------------------------------
  exportData() {
    const { exercises, workouts, sessions, setEntries, settings } = get()
    return {
      app: 'ibralifts',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { exercises, workouts, sessions, setEntries },
      settings,
    }
  },

  async importData(payload) {
    const data = payload?.data || payload
    // Require the full shape before touching the DB — replaceAll wipes every
    // store first, so a partial/foreign file must NOT be accepted (it would
    // silently erase all history).
    const required = ['exercises', 'workouts', 'sessions', 'setEntries']
    if (!data || required.some((k) => !Array.isArray(data[k]))) {
      throw new Error('That file does not look like an ibralifts backup.')
    }
    await db.replaceAll(data)
    if (payload?.settings) {
      saveSettings(payload.settings)
    }
    const fresh = await db.loadAll()
    set({ ...fresh, settings: payload?.settings || get().settings })
  },

  async wipeAll() {
    await db.wipeAll()
    set({ exercises: [], workouts: [], sessions: [], setEntries: [] })
  },
}))

// Stable, memoized read-model for selectors. Subscribes to each array
// individually (references only change on mutation), so it never trips
// useSyncExternalStore's "snapshot should be cached" guard.
export function useSnapshot() {
  const exercises = useStore((s) => s.exercises)
  const workouts = useStore((s) => s.workouts)
  const sessions = useStore((s) => s.sessions)
  const setEntries = useStore((s) => s.setEntries)
  return useMemo(
    () => ({ exercises, workouts, sessions, setEntries }),
    [exercises, workouts, sessions, setEntries]
  )
}
