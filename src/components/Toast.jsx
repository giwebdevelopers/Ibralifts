import { useEffect } from 'react'
import { create } from 'zustand'

// Tiny global toast — one message at a time, auto-dismisses.
const useToastStore = create((set) => ({
  message: null,
  show(message, ms = 2200) {
    set({ message, _ms: ms, _at: Date.now() })
  },
  clear() {
    set({ message: null })
  },
}))

export function toast(message, ms) {
  useToastStore.getState().show(message, ms)
}

export function ToastHost() {
  const message = useToastStore((s) => s.message)
  const ms = useToastStore((s) => s._ms)
  const clear = useToastStore((s) => s.clear)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(clear, ms || 2200)
    return () => clearTimeout(t)
  }, [message, ms, clear])

  if (!message) return null
  return <div className="toast">{message}</div>
}
