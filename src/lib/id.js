// Small, dependency-free unique id. crypto.randomUUID where available,
// with a fallback for older webviews.
export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + '-' + performance.now().toString(36)
}
