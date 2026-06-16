import SetRow from './SetRow'
import DiffIndicator from './DiffIndicator'
import { Plus, Timer, ChevronRight, Trophy, ArrowDown } from './Icons'
import {
  topSet,
  isWeightPR,
  overloadSuggestion,
  compareValue,
  isDropSet,
  setSegments,
} from '../lib/calc'
import { fmtKg, fmtWeight, fmtSigned, relativeDay } from '../lib/format'

// Concise summary of a set list: "3 × 8 @ 60 kg" when uniform, else a list.
// Drop sets render their segments with arrows, e.g. "20×8→15×6→10×4".
function summarize(sets) {
  if (!sets || !sets.length) return null
  if (!sets.some(isDropSet)) {
    const weights = sets.map((s) => Number(s.weight) || 0)
    const reps = sets.map((s) => Number(s.reps) || 0)
    const uniform = weights.every((w) => w === weights[0]) && reps.every((r) => r === reps[0])
    if (uniform) return `${sets.length} × ${reps[0]} @ ${fmtKg(weights[0])}`
    return sets.map((s) => `${fmtWeight(s.weight)}×${s.reps}`).join('  ')
  }
  return sets
    .map((s) =>
      isDropSet(s)
        ? setSegments(s)
            .map((seg) => `${fmtWeight(seg.weight)}×${seg.reps}`)
            .join('→')
        : `${fmtWeight(s.weight)}×${s.reps}`
    )
    .join('   ')
}

export default function ExerciseCard({
  exercise,
  sets,
  prevSets,
  prevSession,
  priorBest,
  repGoal,
  onAddSet,
  onAddDropSet,
  onUpdateSet,
  onDeleteSet,
  onOpenProgress,
  onStartRest,
  onApplyNudge,
}) {
  const curTop = topSet(sets)
  const prevTop = topSet(prevSets)
  const hasPrev = prevSets && prevSets.length > 0

  // Exercise-level diff: this session's top-set weight vs last time's.
  const topDiff = hasPrev
    ? compareValue(Number(curTop?.weight) || 0, Number(prevTop?.weight) || 0)
    : { dir: 'new', delta: 0 }

  // PR in the moment: any current set beats the all-time best (pre-session).
  // Only meaningful once a baseline exists — the first session sets baselines.
  const canPR = priorBest > 0
  const gotPR = canPR && sets.some((s) => isWeightPR(s, priorBest))

  // Progressive-overload nudge from last time's clean completion.
  const nudge = overloadSuggestion(prevSets, repGoal)
  // Only surface the nudge while the loaded weights still match last time
  // (i.e. you haven't already bumped them).
  const stillMatchesPrev =
    nudge &&
    sets.length > 0 &&
    sets.every((s) => (Number(s.weight) || 0) === nudge.fromWeight)
  const showNudge = nudge && stillMatchesPrev

  return (
    <div className="exercise">
      <button type="button" className="exercise-head" onClick={() => onOpenProgress(exercise)}>
        <span className="name">
          {exercise.name}
          {gotPR && (
            <span className="pr-badge">
              <Trophy size={12} /> PR
            </span>
          )}
        </span>
        <ChevronRight className="chevron" size={18} />
      </button>

      <div className="exercise-last">
        {hasPrev ? (
          <>
            <span>
              Last {relativeDay(prevSession?.date)} · {summarize(prevSets)}
            </span>
            <DiffIndicator
              dir={topDiff.dir}
              label={topDiff.dir === 'same' ? 'same' : fmtSigned(topDiff.delta, ' kg')}
            />
          </>
        ) : (
          <span className="faint">First time — set your baseline.</span>
        )}
      </div>

      {showNudge && (
        <div className="nudge">
          <span className="nudge-text">
            Hit all {nudge.reps}+ reps last time — try {fmtKg(nudge.toWeight)}.
          </span>
          <button type="button" onClick={() => onApplyNudge(exercise.id, nudge.toWeight)}>
            Apply
          </button>
        </div>
      )}

      <div className="set-grid">
        <div className="set-head">
          <div>#</div>
          <div className="col-c">Weight</div>
          <div className="col-c">Reps</div>
          <div className="col-c">vs</div>
        </div>
        {sets.map((s, i) => (
          <SetRow
            key={s.id}
            set={s}
            prev={prevSets ? prevSets[i] : null}
            isPR={canPR && isWeightPR(s, priorBest)}
            onChange={(patch) => onUpdateSet(s.id, patch)}
            onDelete={() => onDeleteSet(s.id)}
          />
        ))}
      </div>

      <div className="set-tools">
        <button type="button" className="linkbtn" onClick={() => onAddSet(exercise.id)}>
          <Plus size={18} /> Add set
        </button>
        <button type="button" className="linkbtn" onClick={() => onAddDropSet(exercise.id)}>
          <ArrowDown size={18} /> Drop set
        </button>
        <button type="button" className="linkbtn subtle" onClick={onStartRest}>
          <Timer size={18} /> Rest
        </button>
      </div>
    </div>
  )
}
