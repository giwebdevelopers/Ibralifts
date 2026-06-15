import { useEffect, useRef, useState } from 'react'
import { Plus, Minus } from './Icons'

// A plus/minus stepper with a typeable centre value.
// Hold a button to repeat (accelerating) — handy for big weight jumps.
export default function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  unit,
  decimals = 2,
  ariaLabel,
  compact = false,
}) {
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const holdRef = useRef(null)
  const inputRef = useRef(null)

  // The running hold-to-repeat timer chain is captured at pointer-down time, so
  // it must read the freshest value/onChange via refs — not the stale closure.
  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Keep the visible text in sync with the value unless the user is typing.
  useEffect(() => {
    if (!editing) setText(formatNum(value, decimals))
  }, [value, editing, decimals])

  function clamp(n) {
    if (Number.isNaN(n)) return min
    return Math.min(max, Math.max(min, n))
  }

  function bump(dir) {
    const cur = Number(valueRef.current) || 0
    const next = clamp(roundTo(cur + dir * step, decimals))
    if (next !== valueRef.current) {
      onChangeRef.current(next)
      vibrate(8)
    }
  }

  function startHold(dir) {
    bump(dir)
    let delay = 380
    const tick = () => {
      bump(dir)
      delay = Math.max(50, delay - 60)
      holdRef.current = setTimeout(tick, delay)
    }
    holdRef.current = setTimeout(tick, delay)
  }

  function stopHold() {
    if (holdRef.current) {
      clearTimeout(holdRef.current)
      holdRef.current = null
    }
  }

  useEffect(() => () => stopHold(), [])

  function commitText() {
    setEditing(false)
    const parsed = parseFloat(text.replace(',', '.'))
    if (Number.isNaN(parsed)) {
      setText(formatNum(value, decimals))
      return
    }
    onChange(clamp(roundTo(parsed, decimals)))
  }

  return (
    <div className={`stepper${compact ? ' compact' : ''}`} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        aria-label={`decrease ${ariaLabel || ''}`}
        onPointerDown={(e) => {
          e.preventDefault()
          startHold(-1)
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        disabled={Number(value) <= min}
      >
        <Minus size={20} />
      </button>

      <div className="value">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={text}
          aria-label={ariaLabel}
          onFocus={(e) => {
            setEditing(true)
            requestAnimationFrame(() => e.target.select())
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur()
          }}
        />
        {unit && <div className="unit">{unit}</div>}
      </div>

      <button
        type="button"
        aria-label={`increase ${ariaLabel || ''}`}
        onPointerDown={(e) => {
          e.preventDefault()
          startHold(1)
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        disabled={Number(value) >= max}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}

function roundTo(n, decimals) {
  const f = Math.pow(10, decimals)
  return Math.round(n * f) / f
}

function formatNum(n, decimals) {
  const r = roundTo(Number(n) || 0, decimals)
  return String(r)
}

function vibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {
    /* ignore */
  }
}
