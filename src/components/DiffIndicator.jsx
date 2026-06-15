import { ArrowUp, ArrowDown, Dash } from './Icons'

// Small coloured up/down/same indicator. `dir` is 'up'|'down'|'same'|'new'.
// Optional `label` shows a value next to the arrow (e.g. "+2.5").
export default function DiffIndicator({ dir, label, size = 13, iconOnly = false }) {
  if (dir === 'new') {
    if (iconOnly) return <span className="diff new" aria-hidden />
    return <span className="diff new">{label || 'first'}</span>
  }
  const Icon = dir === 'up' ? ArrowUp : dir === 'down' ? ArrowDown : Dash
  return (
    <span className={`diff ${dir}`}>
      <Icon size={size} />
      {!iconOnly && label != null && <span className="tnum">{label}</span>}
    </span>
  )
}
