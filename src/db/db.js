import { openDB } from 'idb'

// ---------------------------------------------------------------------------
// IndexedDB setup. Four normalized object stores mirror the data model:
//   exercises  : { id, name }
//   workouts   : { id, name, exerciseIds[], createdAt }
//   sessions   : { id, workoutId, date, finishedAt }
//   setEntries : { id, sessionId, exerciseId, setNumber, weight, reps, rpe?, note? }
//
// Everything lives on-device and forever, until the user clears it.
// ---------------------------------------------------------------------------

const DB_NAME = 'ibralifts'
const DB_VERSION = 1

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const s = db.createObjectStore('sessions', { keyPath: 'id' })
          s.createIndex('workoutId', 'workoutId')
        }
        if (!db.objectStoreNames.contains('setEntries')) {
          const se = db.createObjectStore('setEntries', { keyPath: 'id' })
          se.createIndex('sessionId', 'sessionId')
          se.createIndex('exerciseId', 'exerciseId')
        }
      },
    })
  }
  return dbPromise
}

export const STORES = ['exercises', 'workouts', 'sessions', 'setEntries']

// Load the entire dataset into memory. The dataset is tiny (years of lifting
// is a few MB at most), so an in-memory mirror keeps the UI synchronous and fast.
export async function loadAll() {
  const db = await getDB()
  const [exercises, workouts, sessions, setEntries] = await Promise.all([
    db.getAll('exercises'),
    db.getAll('workouts'),
    db.getAll('sessions'),
    db.getAll('setEntries'),
  ])
  return { exercises, workouts, sessions, setEntries }
}

// Generic single-record write-through helpers.
export async function put(store, value) {
  const db = await getDB()
  await db.put(store, value)
  return value
}

export async function del(store, id) {
  const db = await getDB()
  await db.delete(store, id)
}

export async function bulkPut(store, values) {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  for (const v of values) tx.store.put(v)
  await tx.done
}

export async function bulkDelete(store, ids) {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  for (const id of ids) tx.store.delete(id)
  await tx.done
}

// Replace the entire database contents (used by Import).
export async function replaceAll({ exercises, workouts, sessions, setEntries }) {
  const db = await getDB()
  const tx = db.transaction(STORES, 'readwrite')
  // Issue every clear/put without awaiting mid-transaction; only await tx.done.
  // Awaiting between ops can let the IndexedDB tx auto-commit early.
  for (const s of STORES) tx.objectStore(s).clear()
  for (const e of exercises || []) tx.objectStore('exercises').put(e)
  for (const w of workouts || []) tx.objectStore('workouts').put(w)
  for (const s of sessions || []) tx.objectStore('sessions').put(s)
  for (const se of setEntries || []) tx.objectStore('setEntries').put(se)
  await tx.done
}

export async function wipeAll() {
  const db = await getDB()
  const tx = db.transaction(STORES, 'readwrite')
  for (const s of STORES) tx.objectStore(s).clear()
  await tx.done
}
