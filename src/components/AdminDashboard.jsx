import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchApplications,
  updateStatus,
  updateNotes,
  getCVUrl,
  deleteApplication,
  adminLogin,
  adminLogout,
  getAdminSession,
  fetchTickets,
  updateTicketStatus,
  fetchSubscribers,
} from '../lib/applications'
import { fetchJobs, createJob, updateJob, deleteJob } from '../lib/jobs'
import styles from './AdminDashboard.module.css'
import authStyles from './CandidateAuth.module.css'

const STATUS_COLORS = {
  applied:     { bg: 'rgba(204,102,51,0.14)',  color: '#cc6633', label: 'Applied' },
  reviewing:   { bg: 'rgba(55,138,221,0.14)',  color: '#378add', label: 'Reviewing' },
  interviewed: { bg: 'rgba(99,153,34,0.14)',   color: '#5a8f1a', label: 'Interviewed' },
  offered:     { bg: 'rgba(127,119,221,0.14)', color: '#7F77DD', label: 'Offered' },
  hired:       { bg: 'rgba(29,185,84,0.14)',   color: '#1a9e4a', label: 'Hired' },
  rejected:    { bg: 'rgba(226,75,74,0.14)',   color: '#E24B4A', label: 'Rejected' },
}

const STATUS_ORDER = ['applied','reviewing','interviewed','offered','hired','rejected']

const TICKET_STATUS_COLORS = {
  open:        { bg: 'rgba(204,102,51,0.14)',  color: '#cc6633', label: 'Open' },
  in_progress: { bg: 'rgba(55,138,221,0.14)',  color: '#378add', label: 'In Progress' },
  resolved:    { bg: 'rgba(29,185,84,0.14)',   color: '#1a9e4a', label: 'Resolved' },
  closed:      { bg: 'rgba(120,120,120,0.14)', color: '#888',    label: 'Closed' },
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
function LoginScreen({ onLogin, onClose }) {
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
    <>
      <div className={authStyles.head}>
        <div>
          <div className={authStyles.brand}>Arcvoy Admin</div>
          <div className={authStyles.title}>Employee Login</div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
          </svg>
        </button>
      </div>
      <div className={authStyles.body}>
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
        {error && <div className={authStyles.err}>{error}</div>}
        <button className="sub-btn" onClick={submit} disabled={loading}>
          {loading ? <><div className="spinner" /> Signing in…</> : 'Sign In →'}
        </button>
      </div>
    </>
  )
}

/* ── Applicant Detail Drawer ── */
function ApplicantDrawer({ app, onClose, onStatusChange, onNotesChange, onDelete }) {
  const [notes, setNotes] = useState(app.notes || '')
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete application from ${app.first_name} ${app.last_name}? This cannot be undone.`)) return
    setDeleting(true)
    try { await onDelete(app.id) } catch { setDeleting(false) }
  }

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
      window.open(url, '_blank')
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

  const onDelete = async (id) => {
    await deleteApplication(id)
    setApps(prev => prev.filter(a => a.id !== id))
    setSelected(null)
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
              <span></span>
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
                  <span>
                    <button className={styles.trashBtn}
                      onClick={e => { e.stopPropagation(); if (window.confirm(`Delete application from ${app.first_name} ${app.last_name}?`)) onDelete(app.id) }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
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
            onDelete={onDelete}
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

/* ── Jobs View ── */
const EMPTY_JOB = { title: '', dept: '', type: '', salary: '', desc: '', reqs: '', bonus: '', locations: '', active: true }

function JobsView() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY_JOB)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const res = await supabase.from('jobs').select('*').order('created_at', { ascending: true })
      setJobs(res.data || [])
    } catch { setJobs([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing('new'); setForm(EMPTY_JOB) }
  const openEdit = j => {
    setEditing(j.id)
    setForm({ ...j, desc: j.description || '', reqs: (j.reqs || []).join(', '), bonus: (j.bonus || []).join(', '), locations: (j.locations || []).join(', ') })
  }
  const close = () => { setEditing(null); setForm(EMPTY_JOB) }

  const save = async () => {
    if (!form.title || !form.dept || !form.type) return
    setSaving(true)
    const payload = {
      ...form,
      desc: form.desc,
      reqs: form.reqs.split(',').map(s => s.trim()).filter(Boolean),
      bonus: form.bonus.split(',').map(s => s.trim()).filter(Boolean),
      locations: form.locations.split(',').map(s => s.trim()).filter(Boolean),
    }
    try {
      if (editing === 'new') await createJob(payload)
      else await updateJob(editing, payload)
      await load()
      close()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const toggle = async (j) => {
    await updateJob(j.id, { ...j, desc: j.description, reqs: (j.reqs||[]).join(', '), bonus: (j.bonus||[]).join(', '), locations: (j.locations||[]).join(', '), active: !j.active })
    await load()
  }

  return (
    <div className={styles.viewInner}>
      <div className={styles.viewHeader}>
        <div className={styles.viewTitle}>Jobs <span className={styles.viewCount}>{jobs.length}</span></div>
        <button className={styles.addBtn} onClick={openNew}>+ Add Job</button>
      </div>

      {loading ? <div className={styles.empty}>Loading…</div> : (
        <div className={styles.table}>
          {jobs.map(j => (
            <div key={j.id} className={styles.jobRow} style={{ opacity: j.active ? 1 : 0.45 }}>
              <div className={styles.jobRowMain}>
                <div className={styles.tdNameMain}>{j.title}</div>
                <div className={styles.tdRole}>{j.dept} · {j.type}</div>
              </div>
              <div className={styles.jobRowMeta}>
                <span className={styles.tdDate}>{j.salary}</span>
                <span className={styles.statusBadge} style={{ background: j.active ? 'rgba(99,153,34,0.14)' : 'rgba(226,75,74,0.14)', color: j.active ? '#5a8f1a' : '#E24B4A' }}>
                  {j.active ? 'Active' : 'Hidden'}
                </span>
                <button className={styles.editBtn} onClick={() => openEdit(j)}>Edit</button>
                <button className={styles.editBtn} onClick={() => toggle(j)}>{j.active ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div className={styles.jobFormOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.jobForm}
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}>
              <div className={styles.jobFormHead}>
                <div className={styles.sectionTitle}>{editing === 'new' ? 'New Job' : 'Edit Job'}</div>
                <button className="close-btn" onClick={close}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                  </svg>
                </button>
              </div>
              <div className={styles.jobFormBody}>
                {[
                  { label: 'Job Title *', key: 'title', placeholder: 'e.g. Senior AI Engineer' },
                  { label: 'Department *', key: 'dept', placeholder: 'e.g. AI, Support, Analytics' },
                  { label: 'Work Type *', key: 'type', placeholder: 'Remote / Hybrid / On-site' },
                  { label: 'Salary', key: 'salary', placeholder: 'e.g. $25 / hr' },
                  { label: 'Locations', key: 'locations', placeholder: 'Worldwide, United States (comma-separated)' },
                  { label: 'Requirements', key: 'reqs', placeholder: 'SQL, Communication, Problem solving (comma-separated)' },
                  { label: 'Bonus Skills', key: 'bonus', placeholder: 'Python, Multilingual (comma-separated)' },
                ].map(f => (
                  <div key={f.key} className={styles.field}>
                    <label className="fl">{f.label}</label>
                    <input className="fi" value={form[f.key]} placeholder={f.placeholder}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className={styles.field}>
                  <label className="fl">Description</label>
                  <textarea className="ft" rows={4} value={form.desc} placeholder="Job description…"
                    onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
                </div>
              </div>
              <div className={styles.jobFormFooter}>
                <button className="btn-ghost" onClick={close}>Cancel</button>
                <button className="sub-btn" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : editing === 'new' ? 'Create Job' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function AdminDashboard() {
  const navigate = useNavigate()
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

  if (!session) {
    return (
      <div className={styles.loginPage}>
        <motion.div className={authStyles.box}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}>
          <LoginScreen onLogin={login} onClose={() => navigate('/')} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>

          {/* Top nav bar */}
          <div className={styles.topNav}>
            <div className={styles.topBrand}>✳ Arcvoy Admin</div>
            <div className={styles.topTabs}>
              {[
                { key: 'applications', label: 'Applications' },
                { key: 'tickets',      label: 'Tickets' },
                { key: 'subscribers',  label: 'Subscribers' },
                { key: 'jobs',         label: 'Jobs' },
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
            {activeView === 'jobs'         && <JobsView />}
          </div>

        </div>
    </div>
  )
}
