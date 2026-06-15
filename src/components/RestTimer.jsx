import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { useStore } from '../store/store'
import { X, Plus, Minus } from './Icons'

// Global rest timer. Driven by an absolute end-timestamp so it stays accurate
// even if the tab is backgrounded.
export const useRestTimer = create((set, get) => ({
  endsAt: null,
  duration: 0,
  start(seconds) {
    set({ endsAt: Date.now() + seconds * 1000, duration: seconds })
  },
  stop() {
    set({ endsAt: null })
  },
  add(seconds) {
    const cur = get().endsAt
    if (!cur) return
    set({ endsAt: Math.max(Date.now(), cur + seconds * 1000) })
  },
}))

function softCue(enabled) {
  try {
    if (navigator.vibrate) navigator.vibrate([60, 50, 60])
  } catch {
    /* ignore */
  }
  if (!enabled) return
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 660
    // Quiet, short, gently fading — a calm cue, not an alarm.
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.95)
    osc.onended = () => ctx.close()
  } catch {
    /* ignore */
  }
}

export default function RestTimerHost() {
  const endsAt = useRestTimer((s) => s.endsAt)
  const stop = useRestTimer((s) => s.stop)
  const add = useRestTimer((s) => s.add)
  const soundOn = useStore((s) => s.settings.restSound)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!endsAt) return
    let fired = false
    let lingerTimer = null
    const tick = () => {
      const ms = endsAt - Date.now()
      setRemaining(Math.max(0, ms))
      if (ms <= 0 && !fired) {
        fired = true
        softCue(soundOn)
        // Linger a moment on 0:00, then clear.
        lingerTimer = setTimeout(() => useRestTimer.getState().stop(), 1500)
      }
    }
    tick()
    const id = setInterval(tick, 250)
    // Clear BOTH timers on cleanup so re-starting/extending the rest within the
    // 1.5s linger window doesn't get wiped by a stale stop().
    return () => {
      clearInterval(id)
      if (lingerTimer) clearTimeout(lingerTimer)
    }
  }, [endsAt, soundOn])

  if (!endsAt) return null

  const secs = Math.ceil(remaining / 1000)
  const mm = Math.floor(secs / 60)
  const ss = secs % 60
  const done = remaining <= 0

  return (
    <div className="rest-bar">
      <div className="rest-pill">
        <button type="button" aria-label="subtract 15 seconds" onClick={() => add(-15)}>
          <Minus size={18} />
        </button>
        <div>
          <div className="rest-time">
            {done ? 'Rest done' : `${mm}:${String(ss).padStart(2, '0')}`}
          </div>
          {!done && <div className="rest-label">rest</div>}
        </div>
        <button type="button" aria-label="add 15 seconds" onClick={() => add(15)}>
          <Plus size={18} />
        </button>
        <button type="button" aria-label="stop rest timer" onClick={stop}>
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
