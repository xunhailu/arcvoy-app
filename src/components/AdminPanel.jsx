import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminPanel({ apps, onClose }) {
  const [pass, setPass] = useState('')
  const [authed, setAuthed] = useState(false)
  const [err, setErr] = useState(false)

  const login = () => {
    if (pass === 'admin123') { setAuthed(true); setErr(false) }
    else setErr(true)
  }

  return (
    <AnimatePresence>
      <motion.div className="overlay center" key="admin-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        {!authed ? (
          <motion.div className="center-panel"
            initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: .96 }} transition={{ duration: 0.28 }}>
            <div className="panel-head">
              <div>
                <div className="panel-dept">Restricted Access</div>
                <div className="panel-title">Admin Panel</div>
              </div>
              <button className="close-btn" onClick={onClose}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                </svg>
              </button>
            </div>
            <div className="panel-body">
              <div className="fg">
                <label className="fl">Password</label>
                <input className="fi" type="password" placeholder="Enter password"
                  value={pass} onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()} autoFocus />
                {err && <div className="fn" style={{ color: '#a03030' }}>Incorrect password. Try: admin123</div>}
              </div>
              <div className="fn">Demo: <strong style={{ color: 'var(--tx)' }}>admin123</strong></div>
            </div>
            <div className="panel-foot">
              <button className="sub-btn" onClick={login}>Enter →</button>
            </div>
          </motion.div>
        ) : (
          <motion.div className="side-panel" style={{ width: 'min(660px,100vw)' }}
            initial={{ x: '100%' }} animate={{ x: 0 }}
            transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                  <div className="panel-dept">Applications Dashboard</div>
                  <div className="panel-title">{apps.length} application{apps.length !== 1 ? 's' : ''}</div>
                </div>
                <span className="badge">Admin</span>
              </div>
              <button className="close-btn" onClick={onClose}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                </svg>
              </button>
            </div>
            <div className="panel-body">
              {apps.length === 0
                ? <div className="no-apps">No applications received yet.</div>
                : [...apps].reverse().map((a, i) => (
                  <div key={i} className="app-item">
                    <div className="app-h">
                      <span className="app-name">{a.name}</span>
                      <span className="app-job">{a.job}</span>
                    </div>
                    <div className="app-time">{a.time.toLocaleString()}</div>
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
