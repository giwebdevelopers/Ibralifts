import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/store'
import Home from './screens/Home'
import WorkoutEditor from './screens/WorkoutEditor'
import Session from './screens/Session'
import History from './screens/History'
import SessionDetail from './screens/SessionDetail'
import Settings from './screens/Settings'
import RestTimerHost from './components/RestTimer'
import { ToastHost } from './components/Toast'

export default function App() {
  const ready = useStore((s) => s.ready)
  const init = useStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (!ready) {
    return (
      <div className="app">
        <div className="boot">
          <div className="boot-mark">ibralifts</div>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workout/new" element={<WorkoutEditor />} />
          <Route path="/workout/:id/edit" element={<WorkoutEditor />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<SessionDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <RestTimerHost />
      <ToastHost />
    </HashRouter>
  )
}
