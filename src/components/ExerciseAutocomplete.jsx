import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store/store'
import { Plus, Dumbbell } from './Icons'

// Type-ahead over the exercise library. Picking a suggestion or creating a
// new name calls onSelect with the resolved exercise.
export default function ExerciseAutocomplete({ onSelect, excludeIds = [], autoFocus }) {
  const exercises = useStore((s) => s.exercises)
  const findOrCreate = useStore((s) => s.findOrCreateExercise)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const query = q.trim()
  const matches = useMemo(() => {
    const pool = exercises.filter((e) => !excludeIds.includes(e.id))
    if (!query) {
      return pool.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8)
    }
    const lower = query.toLowerCase()
    return pool
      .filter((e) => e.name.toLowerCase().includes(lower))
      .sort((a, b) => {
        // Prefer prefix matches.
        const ap = a.name.toLowerCase().startsWith(lower) ? 0 : 1
        const bp = b.name.toLowerCase().startsWith(lower) ? 0 : 1
        return ap - bp || a.name.localeCompare(b.name)
      })
      .slice(0, 8)
  }, [exercises, excludeIds, query])

  const exactExists = exercises.some((e) => e.name.toLowerCase() === query.toLowerCase())
  const showCreate = query.length > 0 && !exactExists

  async function pick(exercise) {
    onSelect(exercise)
    setQ('')
    setActive(0)
    inputRef.current?.focus()
  }

  async function create() {
    if (!query) return
    const ex = await findOrCreate(query)
    if (ex) pick(ex)
  }

  function onKeyDown(e) {
    const total = matches.length + (showCreate ? 1 : 0)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(total - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showCreate && active === matches.length) create()
      else if (matches[active]) pick(matches[active])
      else if (showCreate) create()
    }
  }

  return (
    <div className="autocomplete">
      <input
        ref={inputRef}
        className="field"
        placeholder="Search or add an exercise…"
        value={q}
        autoFocus={autoFocus}
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck="false"
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      {(matches.length > 0 || showCreate) && (
        <ul className="suggestions">
          {matches.map((m, i) => (
            <li
              key={m.id}
              className={active === i ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(m)}
            >
              <Dumbbell size={16} style={{ color: 'var(--ink-faint)' }} />
              {m.name}
            </li>
          ))}
          {showCreate && (
            <li
              className={active === matches.length ? 'active' : ''}
              onMouseEnter={() => setActive(matches.length)}
              onClick={create}
            >
              <Plus size={16} style={{ color: 'var(--accent)' }} />
              {query}
              <span className="create-tag">New</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
