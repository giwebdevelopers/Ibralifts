import { useState } from 'react'
import Stepper from './Stepper'
import DiffIndicator from './DiffIndicator'
import { Trash, ArrowDown, Plus, X } from './Icons'
import { WEIGHT_STEP, REP_STEP, compareSet, isDropSet, nextDropDefault } from '../lib/calc'

// One logged set. Weight + reps via compact steppers, a set-level diff vs the
// matching set last time, optional RPE/note (tap the set number), a subtle PR
// highlight — and optional drop-set "drops" beneath the working set.
export default function SetRow({ set, prev, isPR, onChange, onDelete }) {
  const drops = Array.isArray(set.drops) ? set.drops : []
  const isDrop = drops.length > 0
  const hasMeta = set.rpe != null || (set.note && set.note.trim() !== '')
  const [open, setOpen] = useState(false)
  const dir = compareSet(set, prev)

  function updateDrop(i, patch) {
    onChange({ drops: drops.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) })
  }
  function addDrop() {
    const base = drops.length ? drops[drops.length - 1] : set
    onChange({ drops: [...drops, nextDropDefault(base.weight, base.reps)] })
  }
  function removeDrop(i) {
    const next = drops.filter((_, idx) => idx !== i)
    onChange({ drops: next.length ? next : null })
  }

  return (
    <div className={`set-block${isPR ? ' is-pr-block' : ''}`}>
      <div className={`set-row${isPR ? ' is-pr' : ''}`}>
        <button
          type="button"
          className="set-num"
          onClick={() => setOpen((o) => !o)}
          aria-label={`set ${set.setNumber} options`}
          aria-expanded={open}
        >
          {set.setNumber}
          {hasMeta && !open && <span className="meta-dot" />}
        </button>

        <Stepper
          compact
          value={Number(set.weight) || 0}
          onChange={(w) => onChange({ weight: w })}
          step={WEIGHT_STEP}
          decimals={2}
          unit="kg"
          ariaLabel={`set ${set.setNumber} weight`}
        />
        <Stepper
          compact
          value={Number(set.reps) || 0}
          onChange={(r) => onChange({ reps: r })}
          step={REP_STEP}
          decimals={0}
          unit="reps"
          ariaLabel={`set ${set.setNumber} reps`}
        />

        <div className="set-diff">
          <DiffIndicator dir={dir} iconOnly />
        </div>
      </div>

      {isDrop && (
        <div className="drop-list">
          {drops.map((d, i) => (
            <div className="drop-row" key={i}>
              <span className="drop-arrow" aria-hidden>
                <ArrowDown size={14} />
              </span>
              <Stepper
                compact
                value={Number(d.weight) || 0}
                onChange={(w) => updateDrop(i, { weight: w })}
                step={WEIGHT_STEP}
                decimals={2}
                unit="kg"
                ariaLabel={`set ${set.setNumber} drop ${i + 1} weight`}
              />
              <Stepper
                compact
                value={Number(d.reps) || 0}
                onChange={(r) => updateDrop(i, { reps: r })}
                step={REP_STEP}
                decimals={0}
                unit="reps"
                ariaLabel={`set ${set.setNumber} drop ${i + 1} reps`}
              />
              <button
                type="button"
                className="drop-remove"
                onClick={() => removeDrop(i)}
                aria-label={`remove drop ${i + 1}`}
              >
                <X size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="add-drop" onClick={addDrop}>
            <Plus size={15} /> Add drop
          </button>
        </div>
      )}

      {open && (
        <div className="set-extra">
          <input
            className="field rpe-input"
            placeholder="RPE"
            inputMode="decimal"
            defaultValue={set.rpe ?? ''}
            onBlur={(e) => {
              const v = e.target.value.trim()
              const n = v === '' ? null : Math.min(10, Math.max(1, parseFloat(v) || 0))
              onChange({ rpe: n })
            }}
            aria-label={`set ${set.setNumber} RPE`}
          />
          <input
            className="field"
            placeholder="How it felt…"
            defaultValue={set.note || ''}
            onBlur={(e) => onChange({ note: e.target.value })}
            aria-label={`set ${set.setNumber} note`}
          />
          <button
            type="button"
            className="set-meta-toggle"
            onClick={onDelete}
            aria-label={`remove set ${set.setNumber}`}
            style={{ color: 'var(--down)' }}
          >
            <Trash size={18} />
          </button>
        </div>
      )}

      {open && !isDrop && (
        <button type="button" className="make-drop" onClick={addDrop}>
          <ArrowDown size={15} /> Make this a drop set
        </button>
      )}
    </div>
  )
}
