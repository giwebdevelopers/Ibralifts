// ---------------------------------------------------------------------------
// Pure lifting maths. No I/O, no React — easy to reason about and extend.
// Units are kg. Weight increments default to 2.5 kg, reps by 1.
// ---------------------------------------------------------------------------

export const WEIGHT_STEP = 2.5
export const REP_STEP = 1
export const DEFAULT_REP_GOAL = 8 // reps at which we nudge the weight up

// A drop set is one set performed as several back-to-back "drops" (heavy →
// lighter, no rest). It is stored as a normal SetEntry whose weight/reps are
// the first/heaviest drop, plus a `drops` array of the additional drops after
// it. So topSet / PR / comparison keep working off the main (heaviest) numbers.
export function isDropSet(s) {
  return Array.isArray(s?.drops) && s.drops.length > 0
}

// All weight/rep segments of a set, main first then any drops.
export function setSegments(s) {
  const main = { weight: Number(s?.weight) || 0, reps: Number(s?.reps) || 0 }
  if (!isDropSet(s)) return [main]
  return [
    main,
    ...s.drops.map((d) => ({ weight: Number(d.weight) || 0, reps: Number(d.reps) || 0 })),
  ]
}

// Sensible default for a newly-added drop: ~25% lighter (snapped to the 2.5 kg
// grid) and a couple fewer reps. Just a starting point — the user adjusts.
export function nextDropDefault(weight, reps) {
  const w = Math.max(0, Math.floor(((Number(weight) || 0) * 0.75) / WEIGHT_STEP) * WEIGHT_STEP)
  const r = Math.max(1, (Number(reps) || 0) - 2)
  return { weight: w, reps: r }
}

export function setVolume(s) {
  return setSegments(s).reduce((sum, seg) => sum + seg.weight * seg.reps, 0)
}

export function totalVolume(entries) {
  return (entries || []).reduce((sum, s) => sum + setVolume(s), 0)
}

// Epley estimated 1-rep-max. Used only for PR context, never shown as truth.
export function estimate1RM(weight, reps) {
  const w = Number(weight) || 0
  const r = Number(reps) || 0
  if (w <= 0 || r <= 0) return 0
  if (r === 1) return w
  return w * (1 + r / 30)
}

// The heaviest set in a list (tie-break: more reps, then more volume).
export function topSet(entries) {
  let best = null
  for (const s of entries || []) {
    if (!best) {
      best = s
      continue
    }
    const bw = Number(best.weight) || 0
    const sw = Number(s.weight) || 0
    if (sw > bw) best = s
    else if (sw === bw && (Number(s.reps) || 0) > (Number(best.reps) || 0)) best = s
  }
  return best
}

// Direction of one set vs the matching set last time.
// Beating = more weight; at equal weight, more reps. Returns 'up'|'down'|'same'|'new'.
export function compareSet(now, prev) {
  if (!prev) return 'new'
  const nw = Number(now.weight) || 0
  const pw = Number(prev.weight) || 0
  if (nw > pw) return 'up'
  if (nw < pw) return 'down'
  const nr = Number(now.reps) || 0
  const pr = Number(prev.reps) || 0
  if (nr > pr) return 'up'
  if (nr < pr) return 'down'
  return 'same'
}

// Direction + delta for a single numeric comparison (e.g. session volume).
export function compareValue(now, prev) {
  if (prev == null) return { dir: 'new', delta: 0 }
  const delta = now - prev
  if (delta > 0.0001) return { dir: 'up', delta }
  if (delta < -0.0001) return { dir: 'down', delta }
  return { dir: 'same', delta: 0 }
}

// Best (heaviest) weight ever recorded for an exercise across all sets.
export function bestWeight(entries, exerciseId) {
  let best = 0
  for (const s of entries) {
    if (s.exerciseId !== exerciseId) continue
    const w = Number(s.weight) || 0
    if (w > best) best = w
  }
  return best
}

// Is this set a new all-time-heaviest for the exercise, given prior best?
// Only counts as a PR when reps >= 1 and weight strictly beats the prior best.
export function isWeightPR(set, priorBest) {
  const w = Number(set.weight) || 0
  const r = Number(set.reps) || 0
  return r > 0 && w > 0 && w > priorBest
}

// Gentle progressive-overload suggestion.
// If every set last time was the same weight and all reps hit the goal,
// suggest the next weight increment. Returns null when no clean bump applies.
export function overloadSuggestion(prevEntries, repGoal = DEFAULT_REP_GOAL, step = WEIGHT_STEP) {
  const sets = (prevEntries || []).filter((s) => (Number(s.reps) || 0) > 0)
  if (sets.length < 1) return null
  const weights = sets.map((s) => Number(s.weight) || 0)
  const sameWeight = weights.every((w) => w === weights[0])
  if (!sameWeight || weights[0] <= 0) return null
  const allHitGoal = sets.every((s) => (Number(s.reps) || 0) >= repGoal)
  if (!allHitGoal) return null
  return {
    fromWeight: weights[0],
    toWeight: Math.round((weights[0] + step) * 100) / 100,
    reps: Math.min(...sets.map((s) => Number(s.reps) || 0)),
  }
}

// Round a typed/stepped weight to a sane kg grid (nearest 0.25, never negative).
export function clampWeight(w) {
  const n = Math.max(0, Number(w) || 0)
  return Math.round(n * 4) / 4
}

export function clampReps(r) {
  return Math.max(0, Math.round(Number(r) || 0))
}
