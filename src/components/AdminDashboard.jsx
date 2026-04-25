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
  fetchTickets,
  updateTicketStatus,
  fetchSubscribers,
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

const TICKET_STATUS_COLORS = {
  open:        { bg: '#2a2520', color: '#cc6633', label: 'Open' },
  in_progress: { bg: '#1a2535', color: '#378add', label: 'In Progress' },
  resolved:    { bg: '#1e2a1a', color: '#1DB954', label: 'Resolved' },
  closed:      { bg: '#1a1a1a', color: '#6b6b6b', label: 'Closed' },
}
const TICKET_STATUS_ORDER = ['open','in_progress','resolved','closed']

/* ── CSV export helper ── */
function exportCSV(data, filename) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const escape = v => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
  }
  const rows = [keys.join(','), ...data.map(row => keys.map(k => escape(row[k])).join(','))]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

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
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>
      <div className={styles.loginBox}>
        <div className={styles.loginHead}>
          <div className={styles.loginBrand}>
            <motion.span className={styles.loginLogoMark}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 1.5] }}
              transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.2, 0.72, 1], ease: 'easeInOut' }}>
              <svg width="26" height="25" viewBox="0 0 73 71" fill="none">
                <path d="M0 0 C2.23046875 -0.00390625 2.23046875 -0.00390625 5 1 C6.83422755 3.49673729 8.04464876 6.2453201 9.3125 9.0625 C9.67150391 9.82111328 10.03050781 10.57972656 10.40039062 11.36132812 C11.28335948 13.2332221 12.14387587 15.11567717 13 17 C13.99 11.72 14.98 6.44 16 1 C17.32 1.33 18.64 1.66 20 2 C19.40984815 7.50808397 18.43336231 12.64878069 17 18 C19.7790214 15.37536868 21.98818512 13.01919919 24 9.75 C26 7 26 7 28.75 6.125 C29.4925 6.08375 30.235 6.0425 31 6 C31.7109375 8.2109375 31.7109375 8.2109375 32 11 C30.6015625 13.3515625 30.6015625 13.3515625 28.625 15.625 C25.74841434 18.97718523 25.74841434 18.97718523 24 23 C25.175625 22.67 26.35125 22.34 27.5625 22 C31.5011676 21.0030467 34.95139129 20.83130797 39 21 C38.3046875 22.921875 38.3046875 22.921875 37 25 C34.7578125 25.828125 34.7578125 25.828125 32.125 26.25 C31.26132812 26.39953125 30.39765625 26.5490625 29.5078125 26.703125 C27 27 27 27 23 27 C23 27.66 23 28.32 23 29 C27.95 29 32.9 29 38 29 C38.495 30.98 38.495 30.98 39 33 C34.61078349 34.29477815 31.94228883 33.6054454 27.6875 32.0625 C26.61886719 31.68222656 25.55023438 31.30195312 24.44921875 30.91015625 C23.64097656 30.60980469 22.83273438 30.30945313 22 30 C22.66 30.61875 23.32 31.2375 24 31.875 C26 34 26 34 26 36 C26.5775 36.2475 27.155 36.495 27.75 36.75 C30.32939979 38.18299988 32.06121592 39.78424676 34 42 C34 42.66 34 43.32 34 44 C29.40693504 42.5140084 26.56430755 40.14985318 23 37 C23.66 38.0725 24.32 39.145 25 40.25 C26.88295807 43.30980686 27 44.1335864 27 48 C25.234375 47.84765625 25.234375 47.84765625 23 47 C21.078125 44.49609375 21.078125 44.49609375 19.25 41.4375 C18.63640625 40.42558594 18.0228125 39.41367187 17.390625 38.37109375 C16.70226563 37.19740234 16.70226563 37.19740234 16 36 C15.95101562 36.81984375 15.90203125 37.6396875 15.8515625 38.484375 C15.77679688 39.56203125 15.70203125 40.6396875 15.625 41.75 C15.55539063 42.81734375 15.48578125 43.8846875 15.4140625 44.984375 C15.0271777 47.80206432 14.44313834 49.5830366 13 52 C11.515 51.505 11.515 51.505 10 51 C10.66 45.72 11.32 40.44 12 35 C11.31292969 35.9384375 10.62585938 36.876875 9.91796875 37.84375 C9.00831427 39.06287456 8.09813047 40.28160429 7.1875 41.5 C6.50977539 42.43005859 6.50977539 42.43005859 5.81835938 43.37890625 C4.61664854 44.97533962 3.31346367 46.49417079 2 48 C1.01 48 0.02 48 -1 48 C0.34929464 44.16336928 2.07751025 41.34827431 4.625 38.1875 C5.25664062 37.39730469 5.88828125 36.60710938 6.5390625 35.79296875 C7.02117188 35.20128906 7.50328125 34.60960937 8 34 C4.42403469 35.71198339 1.19995767 37.78659241 -2.09765625 39.9765625 C-4 41 -4 41 -7 41 C-6.64537771 38.22312716 -6.24613432 37.20868995 -4.07421875 35.3671875 C-3.28660156 34.87476563 -2.49898437 34.38234375 -1.6875 33.875 C-0.90761719 33.37742188 -0.12773437 32.87984375 0.67578125 32.3671875 C2.74879023 31.14777045 4.83311354 30.04129555 7 29 C5.97519531 28.95101562 4.95039063 28.90203125 3.89453125 28.8515625 C2.5338294 28.77648929 1.17315356 28.70094345 -0.1875 28.625 C-1.19780273 28.57859375 -1.19780273 28.57859375 -2.22851562 28.53125 C-6.19678975 28.29896078 -9.40729879 27.71612524 -13 26 C-13 25.67 -13 25.34 -13 25 C-6.4 25 0.2 25 7 25 C2.11678161 21.87611034 2.11678161 21.87611034 -2.78295898 18.77832031 C-3.38954346 18.38225586 -3.99612793 17.98619141 -4.62109375 17.578125 C-5.2442749 17.18012695 -5.86745605 16.78212891 -6.50952148 16.37207031 C-8.34015423 14.68686867 -8.61983083 13.42048538 -9 11 C-7.359375 10.25390625 -7.359375 10.25390625 -5 10 C-2.203125 11.65234375 -2.203125 11.65234375 0.75 13.9375 C1.73484375 14.68902344 2.7196875 15.44054688 3.734375 16.21484375 C4.48203125 16.80394531 5.2296875 17.39304687 6 18 C5.57847656 17.26394531 5.15695313 16.52789063 4.72265625 15.76953125 C4.17480469 14.79371094 3.62695312 13.81789063 3.0625 12.8125 C2.51722656 11.84957031 1.97195312 10.88664062 1.41015625 9.89453125 C0.08224095 7.16881038 -0.67327978 5.0027144 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z" fill="currentColor" transform="translate(24,7)"/>
              </svg>
            </motion.span>
            <span className={styles.loginBrandText}>Arcvoy</span>
          </div>
          <div className={styles.loginTitle}>Employee Login</div>
          <div className={styles.loginSub}>Sign in to manage applications</div>
        </div>
        <div className={styles.loginBody}>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label className="fl">Email</label>
            <input className="fi" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          </div>
          <div className="fg" style={{ marginBottom: 0 }}>
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

/* ── Ticket Detail Drawer ── */
function TicketDrawer({ ticket, onClose, onStatusChange }) {
  const [statusLoading, setStatusLoading] = useState(false)

  const changeStatus = async (status) => {
    setStatusLoading(true)
    await onStatusChange(ticket.id, status)
    setStatusLoading(false)
  }

  const sc = TICKET_STATUS_COLORS[ticket.status] || TICKET_STATUS_COLORS.open

  return (
    <motion.div className={styles.drawer}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>

      <div className={styles.drawerHead}>
        <div>
          <div className={styles.drawerRole}>{ticket.category}</div>
          <div className={styles.drawerName}>{ticket.subject}</div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
          </svg>
        </button>
      </div>

      <div className={styles.drawerBody}>

        <div className={styles.statusSection}>
          <div className={styles.statusLabel}>Current Status</div>
          <div className={styles.statusBadge} style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </div>
          <div className={styles.statusLabel} style={{ marginTop: 16 }}>Update Status</div>
          <div className={styles.statusBtns}>
            {TICKET_STATUS_ORDER.map(s => {
              const c = TICKET_STATUS_COLORS[s]
              return (
                <button key={s}
                  className={`${styles.statusBtn} ${ticket.status === s ? styles.statusBtnActive : ''}`}
                  style={ticket.status === s ? { background: c.bg, color: c.color, borderColor: c.color } : {}}
                  onClick={() => changeStatus(s)} disabled={statusLoading || ticket.status === s}>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>From</div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span>Name</span><strong>{ticket.name}</strong></div>
            <div className={styles.detailItem}><span>Email</span><strong>{ticket.email}</strong></div>
            <div className={styles.detailItem}><span>Submitted</span>
              <strong>{new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Message</div>
          <div className={styles.ticketMessage}>{ticket.message}</div>
        </div>

      </div>
    </motion.div>
  )
}

/* ── Applications View ── */
function ApplicationsView({ apps, loading }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [apps_, setApps] = useState(apps)

  useEffect(() => { setApps(apps) }, [apps])

  const onStatusChange = async (id, status, app) => {
    await updateStatus(id, status, app)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const onNotesChange = async (id, notes) => {
    await updateNotes(id, notes)
    setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a))
  }

  const filtered = apps_.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.job_title?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = apps_.filter(a => a.status === s).length
    return acc
  }, {})

  const handleExport = () => {
    const rows = filtered.map(a => ({
      first_name: a.first_name,
      last_name: a.last_name,
      email: a.email,
      job_title: a.job_title,
      job_dept: a.job_dept,
      job_type: a.job_type,
      status: a.status,
      country: a.country,
      city: a.city,
      state: a.state,
      linkedin: a.linkedin,
      languages: [a.lang1, a.lang2].filter(Boolean).join(', '),
      cv: a.cv_filename || '',
      applied: new Date(a.created_at).toISOString().slice(0, 10),
    }))
    exportCSV(rows, 'arcvoy-applications.csv')
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <div className={styles.sideNav} style={{ paddingTop: 12 }}>
          <div className={styles.sideLabel}>Filter by Status</div>
          <button className={`${styles.sideItem} ${filter === 'all' ? styles.sideItemActive : ''}`}
            onClick={() => setFilter('all')}>
            All Applications
            <span className={styles.count}>{apps_.length}</span>
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
      </div>

      <div className={styles.main}>
        <div className={styles.mainHead}>
          <div>
            <div className={styles.mainTitle}>Applications</div>
            <div className={styles.mainSub}>{filtered.length} of {apps_.length} total</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className={styles.searchInput} placeholder="Search name, email, role…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className={styles.exportBtn} onClick={handleExport} title="Export to CSV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV
            </button>
          </div>
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
                    <div className={styles.avatar}>{app.first_name?.[0] || '?'}{app.last_name?.[0] || '?'}</div>
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
  )
}

/* ── Tickets View ── */
function TicketsView() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchTickets().then(data => { setTickets(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const onStatusChange = async (id, status) => {
    await updateTicketStatus(id, status)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const counts = TICKET_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length
    return acc
  }, {})

  const handleExport = () => {
    const rows = filtered.map(t => ({
      name: t.name,
      email: t.email,
      category: t.category,
      subject: t.subject,
      status: t.status,
      message: t.message,
      submitted: new Date(t.created_at).toISOString().slice(0, 10),
    }))
    exportCSV(rows, 'arcvoy-tickets.csv')
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <div className={styles.sideNav} style={{ paddingTop: 12 }}>
          <div className={styles.sideLabel}>Filter by Status</div>
          <button className={`${styles.sideItem} ${filter === 'all' ? styles.sideItemActive : ''}`}
            onClick={() => setFilter('all')}>
            All Tickets
            <span className={styles.count}>{tickets.length}</span>
          </button>
          {TICKET_STATUS_ORDER.map(s => {
            const c = TICKET_STATUS_COLORS[s]
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
      </div>

      <div className={styles.main}>
        <div className={styles.mainHead}>
          <div>
            <div className={styles.mainTitle}>Support Tickets</div>
            <div className={styles.mainSub}>{filtered.length} of {tickets.length} total</div>
          </div>
          <button className={styles.exportBtn} onClick={handleExport} title="Export to CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            CSV
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No tickets found.</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.thead} style={{ gridTemplateColumns: '1.8fr 2fr 1fr 1fr 0.8fr' }}>
              <span>From</span>
              <span>Subject</span>
              <span>Category</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {filtered.map(ticket => {
              const sc = TICKET_STATUS_COLORS[ticket.status] || TICKET_STATUS_COLORS.open
              return (
                <motion.div key={ticket.id}
                  className={`${styles.trow} ${selected?.id === ticket.id ? styles.trowActive : ''}`}
                  style={{ gridTemplateColumns: '1.8fr 2fr 1fr 1fr 0.8fr' }}
                  onClick={() => setSelected(ticket)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}>
                  <span className={styles.tdName}>
                    <div className={styles.avatar}>{ticket.name?.[0] || '?'}</div>
                    <div>
                      <div className={styles.tdNameMain}>{ticket.name}</div>
                      <div className={styles.tdNameSub}>{ticket.email}</div>
                    </div>
                  </span>
                  <span>
                    <div className={styles.tdRole}>{ticket.subject}</div>
                  </span>
                  <span>
                    <div className={styles.tdDept}>{ticket.category}</div>
                  </span>
                  <span>
                    <span className={styles.statusPill} style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </span>
                  <span className={styles.tdDate}>
                    {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <TicketDrawer
            key={selected.id}
            ticket={selected}
            onClose={() => setSelected(null)}
            onStatusChange={onStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Subscribers View ── */
function SubscribersView() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSubscribers().then(data => { setSubscribers(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = search
    ? subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()))
    : subscribers

  const handleExport = () => {
    const rows = filtered.map(s => ({
      email: s.email,
      signed_up: new Date(s.created_at).toISOString().slice(0, 10),
    }))
    exportCSV(rows, 'arcvoy-subscribers.csv')
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.main}>
        <div className={styles.mainHead}>
          <div>
            <div className={styles.mainTitle}>Newsletter Subscribers</div>
            <div className={styles.mainSub}>{filtered.length} of {subscribers.length} total</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className={styles.searchInput} placeholder="Search email…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className={styles.exportBtn} onClick={handleExport} title="Export to CSV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading subscribers…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No subscribers yet.</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.thead} style={{ gridTemplateColumns: '1fr 1fr' }}>
              <span>Email</span>
              <span>Signed Up</span>
            </div>
            {filtered.map(sub => (
              <motion.div key={sub.id}
                className={styles.trow}
                style={{ gridTemplateColumns: '1fr 1fr', cursor: 'default' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}>
                <span className={styles.tdNameMain}>{sub.email}</span>
                <span className={styles.tdDate}>
                  {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function AdminDashboard({ onClose }) {
  const [session, setSession] = useState(null)
  const [apps, setApps] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeView, setActiveView] = useState('applications')

  useEffect(() => {
    getAdminSession()
      .then(s => {
        setSession(s)
        if (s) loadApps()
        else setAppsLoading(false)
      })
      .catch(() => setAppsLoading(false))
  }, [])

  const loadApps = async () => {
    setAppsLoading(true)
    try { setApps(await fetchApplications()) } catch (e) { console.error(e) }
    setAppsLoading(false)
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

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className={styles.panel}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}>

        {!session ? (
          <LoginScreen onLogin={login} />
        ) : (
          <div className={styles.adminShell}>

            {/* Top nav bar */}
            <div className={styles.topNav}>
              <div className={styles.topBrand}>✳ Arcvoy Admin</div>
              <div className={styles.topTabs}>
                {[
                  { key: 'applications', label: 'Applications' },
                  { key: 'tickets',      label: 'Tickets' },
                  { key: 'subscribers',  label: 'Subscribers' },
                ].map(tab => (
                  <button key={tab.key}
                    className={`${styles.topTab} ${activeView === tab.key ? styles.topTabActive : ''}`}
                    onClick={() => setActiveView(tab.key)}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
            </div>

            {/* Content */}
            <div className={styles.viewWrap}>
              {activeView === 'applications' && <ApplicationsView apps={apps} loading={appsLoading} />}
              {activeView === 'tickets'      && <TicketsView />}
              {activeView === 'subscribers'  && <SubscribersView />}
            </div>

          </div>
        )}
      </motion.div>
    </div>
  )
}
