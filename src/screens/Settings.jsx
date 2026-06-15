import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { toast } from '../components/Toast'
import Stepper from '../components/Stepper'
import { ChevronLeft, Download, Upload, Trash } from '../components/Icons'

const REST_PRESETS = [60, 90, 120, 180]

export default function Settings() {
  const navigate = useNavigate()
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const wipeAll = useStore((s) => s.wipeAll)
  const fileRef = useRef(null)

  function doExport() {
    const payload = exportData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const d = new Date()
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    a.href = url
    a.download = `ibralifts-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Backup downloaded')
  }

  async function doImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('Importing replaces all current data with the backup. Continue?')) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await importData(payload)
      toast('Backup restored')
    } catch (err) {
      alert(err?.message || 'Could not read that file.')
    }
  }

  async function doWipe() {
    if (!confirm('Delete ALL workouts, sessions and history? This cannot be undone.')) return
    if (!confirm('Really delete everything? Consider exporting a backup first.')) return
    await wipeAll()
    toast('All data cleared')
  }

  const formatRest = (sec) => (sec % 60 === 0 ? `${sec / 60} min` : `${sec}s`)

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Workouts
        </button>
      </div>

      <h1 className="title" style={{ marginBottom: 8 }}>
        Settings
      </h1>

      <div className="section-label">Rest timer</div>
      <div className="card">
        <div className="setting-row" style={{ paddingTop: 0 }}>
          <div className="sr-label">
            <div className="t">Default rest</div>
            <div className="d">Used when you tap Rest on a set.</div>
          </div>
        </div>
        <div className="rest-presets">
          {REST_PRESETS.map((sec) => (
            <button
              key={sec}
              className={`chip${settings.restSeconds === sec ? ' active' : ''}`}
              onClick={() => setSettings({ restSeconds: sec })}
            >
              {formatRest(sec)}
            </button>
          ))}
        </div>
        <div className="setting-row">
          <div className="sr-label">
            <div className="t">Finish sound</div>
            <div className="d">A quiet tone plus a vibration when rest ends.</div>
          </div>
          <button
            className={`toggle${settings.restSound ? ' on' : ''}`}
            role="switch"
            aria-checked={settings.restSound}
            aria-label="Finish sound"
            onClick={() => setSettings({ restSound: !settings.restSound })}
          >
            <span className="knob" />
          </button>
        </div>
      </div>

      <div className="section-label">Progressive overload</div>
      <div className="card">
        <div className="setting-row" style={{ paddingTop: 0 }}>
          <div className="sr-label">
            <div className="t">Rep goal</div>
            <div className="d">
              When every set hit this many reps last time, ibralifts suggests adding 2.5 kg.
            </div>
          </div>
          <div style={{ width: 132, flex: 'none' }}>
            <Stepper
              value={settings.repGoal}
              onChange={(v) => setSettings({ repGoal: v })}
              step={1}
              min={1}
              max={30}
              decimals={0}
              unit="reps"
              ariaLabel="rep goal"
            />
          </div>
        </div>
      </div>

      <div className="section-label">Your data</div>
      <div className="card">
        <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          Everything is stored only on this device. Back it up so you never lose your history.
        </p>
        <button className="btn btn-ghost btn-block" onClick={doExport}>
          <Download size={18} /> Export backup (JSON)
        </button>
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 10 }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={18} /> Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={doImport}
        />
      </div>

      <button className="btn btn-danger btn-block" style={{ marginTop: 24 }} onClick={doWipe}>
        <Trash size={18} /> Clear all data
      </button>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center', marginTop: 22 }}>
        ibralifts · local-only · kg
      </p>
    </div>
  )
}
