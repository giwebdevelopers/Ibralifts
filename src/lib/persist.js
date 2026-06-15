// Ask the browser to mark ibralifts' on-device storage as persistent, so it is
// not silently evicted (matters most on iOS). Best-effort and idempotent —
// silently no-ops where unsupported or already granted.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false
    if (already) return
    await navigator.storage.persist()
  } catch {
    /* never let this block app start */
  }
}
