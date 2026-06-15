import { useState } from 'react'
import Stepper from './Stepper'
import DiffIndicator from './DiffIndicator'
import { Trash } from './Icons'
import { WEIGHT_STEP, REP_STEP, compareSet } from '../lib/calc'

// One logged set. Weight + reps via compact steppers, a set-level diff vs the
// matching set last time, optional RPE/note (tap the set number to expand),
// and a subtle PR highlight.
export default function SetRow({ set, prev, isPR, onChange, onDelete }) {
  const hasMeta = set.rpe != null || (set.note && set.note.trim() !== '')
  const [open, setOpen] = useState(false)
  const dir = compareSet(set, prev)

  return (
    <div className={`set-block${isPR ? ' is-pr-block' : ''}`}>
      <div className={`set-row${isPR ? ' is-pr' : ''}`}>
        <button
          type="button"
          className="set-num"
          onClick={() => setOpen((o) => !o)}
          aria-label={`set ${set.setNumber} options`}
          aria-expanded={open}
          style={hasMeta && !open ? { position: 'relative' } : undefined}
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
    </div>
  )
}
