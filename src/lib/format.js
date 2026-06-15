// Display helpers. Units are kg throughout (Australia).

// Trim trailing zeros: 60.0 -> "60", 62.5 -> "62.5"
export function fmtWeight(w) {
  if (w == null || Number.isNaN(w)) return '0'
  return String(Math.round(w * 100) / 100)
}

export function fmtKg(w) {
  return `${fmtWeight(w)} kg`
}

// Compact volume, e.g. 12450 -> "12,450"
export function fmtVolume(v) {
  return Math.round(v).toLocaleString('en-AU')
}

export function fmtSigned(n, suffix = '') {
  const r = Math.round(n * 100) / 100
  const s = r > 0 ? `+${fmtWeight(r)}` : fmtWeight(r)
  return suffix ? `${s}${suffix}` : s
}

// Date helpers operate on ISO timestamps stored on each session.
export function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtDateShort(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// "Today", "Yesterday", "3 days ago", or a date.
export function relativeDay(iso) {
  const then = new Date(iso)
  const now = new Date()
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOf(now) - startOf(then)) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'Last week'
  if (days < 60) return `${Math.round(days / 7)} weeks ago`
  return fmtDateShort(iso)
}
