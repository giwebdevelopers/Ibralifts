# ibralifts

A calm, fast, single-user lift tracker built for one thing: **making progressive
overload effortless.** Log a workout, then next time pull up exactly what you did
last time and beat it.

No login, no accounts, no backend. Everything lives on your device (IndexedDB)
and stays there forever until you clear it. Installable as a PWA.

## Run it

```bash
npm install
npm run icons   # generate the PWA app icons (one-off)
npm run dev     # local dev server
```

Then open the printed URL on your phone (same Wi-Fi) and **Add to Home Screen**.

To build a production copy:

```bash
npm run build
npm run preview
```

## The core loop

1. Create a workout (Push / Pull / Legs) and add exercises.
2. Tap a workout to start today's session — it pre-loads **every set with exactly
   what you lifted last time**.
3. Nudge the numbers you beat, watch the green/red/neutral indicators, finish.

## Features

- **Repeat last session** in one tap, pre-filled set-by-set.
- **vs last time** diff at the set level and as a session summary (volume).
- **Steppers** (2.5 kg / 1 rep) with hold-to-repeat; type if you prefer.
- **Exercise library** with autocomplete — never retype a name.
- **Personal records** flagged in the moment.
- **Volume per session** + a clean **per-exercise progress chart** (tap an exercise).
- **Rest timer** with a quiet finish cue.
- **Per-set RPE / note** (tap the set number).
- **Progressive-overload nudge** when you cleanly hit your rep goal.
- **Export / import** your whole history as JSON.

## Data model

- `Exercise` — `{ id, name }`
- `Workout` (template) — `{ id, name, exerciseIds[] }`
- `Session` — `{ id, workoutId, date, finishedAt }`
- `SetEntry` — `{ id, sessionId, exerciseId, setNumber, weight, reps, rpe?, note? }`

Units are kg.

## Stack

Vite + React + zustand, IndexedDB via `idb`, `vite-plugin-pwa`. No server,
no analytics, no tracking.
