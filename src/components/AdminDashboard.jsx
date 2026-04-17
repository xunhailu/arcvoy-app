import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchApplications,
  updateStatus,
  updateNotes,
  getCVUrl,
  adminLogin,
  adminLogout,
  getAdminSession,
} from '../lib/applications'
import styles from './AdminDashboard.module.css'

const STATUS_COLORS = {
  applied:     { bg: '#2a2520', color: '#cc6633', label: 'Applied' },
  reviewing:   { bg: '#1a2535', color: '#378add', label: 'Reviewing' },
  interviewed: { bg: '#1e2a1a', color: '#639922', label: 'Interviewed' },
  offered:     { bg: '#2a1e35', color: '#7F77DD', label: 'Offered' },
  hired:       { bg: '#0d2a1a', color: '#1DB954', label: 'Hired' },
  rejected:    { bg: '#2a1a1a', color: '#E24B4A', label: 'Rejected' },
}

const STATUS_ORDER = ['applied','reviewing','interviewed','offered','hired','rejected']

/* ── Login Screen ── */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      await onLogin(email, password)
    } catch (e) {
      setError('Incorrect email or password.')
    }
    setLoading(false)
  }

  return (
    <motion.div className={styles.loginWrap}
      initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28 }}>
      <div className={styles.loginBox}>
        <div className={styles.loginHead}>
          <div className={styles.loginBrand}>✳ Arcvoy</div>
          <div className={styles.loginTitle}>Admin Panel</div>
          <div className={styles.loginSub}>Sign in to manage applications</div>
        </div>
        <div className={styles.loginBody}>
          <div className="fg">
            <label className="fl">Email</label>
            <input className="fi" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input className="fi" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          {error && <div className={styles.loginErr}>{error}</div>}
          <button className="sub-btn" onClick={submit} disabled={loading}>
            {loading ? <><div className="spinner" /> Signing in…</> : 'Sign In →'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Applicant Detail Drawer ── */
function ApplicantDrawer({ app, onClose, onStatusChange, onNotesChange }) {
  const [notes, setNotes] = useState(app.notes || '')
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const saveNotes = async () => {
    setSaving(true)
    await onNotesChange(app.id, notes)
    setSaving(false)
  }

  const downloadCV = async () => {
    if (!app.cv_path) return
    setDownloading(true)
    try {
      const url = await getCVUrl(app.cv_path)
      const a = document.createElement('a')
      a.href = url; a.download = app.cv_filename || 'cv.pdf'
      a.click()
    } catch (e) { alert('Could not download CV. Please try again.') }
    setDownloading(false)
  }

  const changeStatus = async (status) => {
    setStatusLoading(true)
    await onStatusChange(app.id, status, app)
    setStatusLoading(false)
  }

  const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied

  return (
    <motion.div className={styles.drawer}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>

      <div className={styles.drawerHead}>
        <div>
          <div className={styles.drawerRole}>{app.job_title} · {app.job_dept}</div>
          <div className={styles.drawerName}>{app.first_name} {app.last_name}</div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
          </svg>
        </button>
      </div>

      <div className={styles.drawerBody}>

        {/* Status badge + changer */}
        <div className={styles.statusSection}>
          <div className={styles.statusLabel}>Current Status</div>
          <div className={styles.statusBadge} style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </div>
          <div className={styles.statusLabel} style={{ marginTop: 16 }}>Update Status</div>
          <div className={styles.statusBtns}>
            {STATUS_ORDER.map(s => {
              const c = STATUS_COLORS[s]
              return (
                <button key={s}
                  className={`${styles.statusBtn} ${app.status === s ? styles.statusBtnActive : ''}`}
                  style={app.status === s ? { background: c.bg, color: c.color, borderColor: c.color } : {}}
                  onClick={() => changeStatus(s)} disabled={statusLoading || app.status === s}>
                  {c.label}
                </button>
              )
            })}
          </div>
          {statusLoading && <div className={styles.statusHint}>Updating and sending email…</div>}
        </div>

        <div className={styles.divider} />

        {/* Personal details */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Personal Details</div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span>Email</span><strong>{app.email || '—'}</strong></div>
            <div className={styles.detailItem}><span>Date of Birth</span><strong>{app.dob || '—'}</strong></div>
            <div className={styles.detailItem}><span>Country</span><strong>{app.country || '—'}</strong></div>
            <div className={styles.detailItem}><span>City</span><strong>{app.city || '—'}</strong></div>
            <div className={styles.detailItem}><span>State</span><strong>{app.state || '—'}</strong></div>
            <div className={styles.detailItem}><span>Address</span><strong>{app.address || '—'}</strong></div>
            <div className={styles.detailItem}><span>LinkedIn</span>
              <strong>{app.linkedin
                ? <a href={app.linkedin} target="_blank" rel="noopener" style={{ color: 'var(--gd)' }}>View Profile</a>
                : '—'}
              </strong>
            </div>
            <div className={styles.detailItem}><span>Languages</span>
              <strong>{[app.lang1, app.lang2].filter(Boolean).join(', ') || '—'}</strong>
            </div>
            <div className={styles.detailItem}><span>Applied</span>
              <strong>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* CV Download */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>CV / Resume</div>
          {app.cv_path ? (
            <button className={styles.cvBtn} onClick={downloadCV} disabled={downloading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? 'Downloading…' : `Download CV — ${app.cv_filename || 'file'}`}
            </button>
          ) : (
            <div className={styles.noCV}>No CV uploaded</div>
          )}
        </div>

        <div className={styles.divider} />

        {/* Notes */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Internal Notes</div>
          <textarea
            className="ft" rows={5}
            placeholder="Add notes about this applicant…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button className={styles.saveBtn} onClick={saveNotes} disabled={saving}>
            {saving ? 'Saving…' : 'Save Notes'}
          </button>
        </div>

      </div>
    </motion.div>
  )
}

/* ── Main Dashboard ── */
export default function AdminDashboard({ onClose }) {
  const [session, setSession] = useState(null)
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAdminSession().then(s => {
      setSession(s)
      if (s) loadApps()
      else setLoading(false)
    })
  }, [])

  const loadApps = async () => {
    setLoading(true)
    try {
      const data = await fetchApplications()
      setApps(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    await adminLogin(email, password)
    const s = await getAdminSession()
    setSession(s)
    loadApps()
  }

  const logout = async () => {
    await adminLogout()
    setSession(null)
    setApps([])
  }

  const onStatusChange = async (id, status, app) => {
    await updateStatus(id, status, app)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const onNotesChange = async (id, notes) => {
    await updateNotes(id, notes)
    setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a))
  }

  const filtered = apps.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.job_title?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length
    return acc
  }, {})

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className={styles.panel}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}>

        {!session ? (
          <LoginScreen onLogin={login} />
        ) : (
          <div className={styles.dashboard}>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              <div className={styles.sideHead}>
                <div className={styles.sideBrand}>✳ Arcvoy</div>
                <div className={styles.sideTitle}>Admin</div>
              </div>

              <div className={styles.sideNav}>
                <div className={styles.sideLabel}>Filter by Status</div>
                <button className={`${styles.sideItem} ${filter === 'all' ? styles.sideItemActive : ''}`}
                  onClick={() => setFilter('all')}>
                  All Applications
                  <span className={styles.count}>{apps.length}</span>
                </button>
                {STATUS_ORDER.map(s => {
                  const c = STATUS_COLORS[s]
                  return (
                    <button key={s}
                      className={`${styles.sideItem} ${filter === s ? styles.sideItemActive : ''}`}
                      onClick={() => setFilter(s)}>
                      <span className={styles.dot} style={{ background: c.color }} />
                      {c.label}
                      <span className={styles.count}>{counts[s] || 0}</span>
                    </button>
                  )
                })}
              </div>

              <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
            </div>

            {/* Main */}
            <div className={styles.main}>
              <div className={styles.mainHead}>
                <div>
                  <div className={styles.mainTitle}>Applications</div>
                  <div className={styles.mainSub}>{filtered.length} of {apps.length} total</div>
                </div>
                <input className={styles.searchInput} placeholder="Search name, email, role…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {loading ? (
                <div className={styles.empty}>Loading applications…</div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>No applications found.</div>
              ) : (
                <div className={styles.table}>
                  <div className={styles.thead}>
                    <span>Name</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Applied</span>
                    <span>CV</span>
                  </div>
                  {filtered.map(app => {
                    const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied
                    return (
                      <motion.div key={app.id}
                        className={`${styles.trow} ${selected?.id === app.id ? styles.trowActive : ''}`}
                        onClick={() => setSelected(app)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}>
                        <span className={styles.tdName}>
                          <div className={styles.avatar}>{app.first_name[0]}{app.last_name[0]}</div>
                          <div>
                            <div className={styles.tdNameMain}>{app.first_name} {app.last_name}</div>
                            <div className={styles.tdNameSub}>{app.email}</div>
                          </div>
                        </span>
                        <span>
                          <div className={styles.tdRole}>{app.job_title}</div>
                          <div className={styles.tdDept}>{app.job_dept} · {app.job_type}</div>
                        </span>
                        <span>
                          <span className={styles.statusPill} style={{ background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </span>
                        <span className={styles.tdDate}>
                          {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span>
                          {app.cv_path
                            ? <span className={styles.cvBadge}>PDF</span>
                            : <span className={styles.noCvBadge}>—</span>}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Applicant detail drawer */}
            <AnimatePresence>
              {selected && (
                <ApplicantDrawer
                  key={selected.id}
                  app={selected}
                  onClose={() => setSelected(null)}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
