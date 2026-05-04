import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchApplications,
  fetchEmailLogs,
  updateStatus,
  sendStatusEmail,
  sendIdentityVerificationEmail,
  sendComplianceVerificationEmail,
  updateNotes,
  getCVUrl,
  deleteApplication,
  updateVerificationLinks,
  createSourcedApplication,
  sendWelcomeEmail,
  sendBlastEmail,
  adminLogin,
  adminLogout,
  getAdminSession,
  fetchTickets,
  updateTicketStatus,
  fetchSubscribers,
} from '../lib/applications'
import { createJob, updateJob } from '../lib/jobs'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import styles from './AdminDashboard.module.css'

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

const EMAIL_TYPE_LABELS = {
  confirmation:            'Application Confirmation',
  admin_notification:      'Admin Alert',
  status_reviewing:        'Reviewing Notification',
  status_interviewed:      'Interview Notification',
  status_offered:          'Offer Notification',
  status_hired:            'Hired Notification',
  status_rejected:         'Rejection Notification',
  identity_verification:   'Identity Verification',
  compliance_verification: 'Compliance Verification',
  welcome:                 'Welcome Email',
}

function formatRelativeDate(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}


/* ── Login Screen ── */
function LoginScreen({ onLogin, onClose }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      await onLogin(email, password)
    } catch {
      setError('Incorrect email or password.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className={styles.loginCard}>

      {/* ── Left brand panel ── */}
      <div className={styles.loginLeft}>
        <div className={styles.loginLeftGlow} />
        <div className={styles.loginLeftContent}>
          <div className={styles.loginMarkWrap}>
            <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
              <path d="M10 50 Q32 6 54 50" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
              <path d="M22 37 L42 37" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
              <circle cx="54" cy="50" r="3.5" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.loginLeftWordmark}>Arcvoy</div>
          <div className={styles.loginLeftDivider} />
          <p className={styles.loginTagline}>The command centre for your talent pipeline</p>
        </div>
        <div className={styles.loginPortalBadge}>Admin Portal</div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.loginRight}>
        <div className={styles.loginRightTop} />

        <h1 className={styles.loginTitle}>Welcome back</h1>
        <p className={styles.loginSub}>Sign in to continue to the dashboard</p>

        <div className={styles.loginForm}>
          <div className={styles.loginFg}>
            <label className={styles.loginLabel}>Email address</label>
            <input className={`${styles.loginInput} ${error ? styles.loginInputErr : ''}`}
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus placeholder="you@arcvoy.com" />
          </div>

          <div className={styles.loginFg}>
            <label className={styles.loginLabel}>Password</label>
            <div className={styles.loginPassWrap}>
              <input className={`${styles.loginInput} ${error ? styles.loginInputErr : ''}`}
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••••" />
              <button type="button" className={styles.loginEye} onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.loginErr}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button className={styles.loginBtn} onClick={submit} disabled={loading}>
            {loading
              ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Signing in…</>
              : 'Sign In →'}
          </button>
        </div>

        <button className={styles.loginBack} onClick={onClose}>← Back to site</button>
      </div>

      </div>
    </>
  )
}

/* ── Applicant Detail Drawer ── */
function ApplicantDrawer({ app, onClose, onStatusChange, onNotesChange, onLinksChange }) {
  const [notes, setNotes] = useState(app.notes || '')
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [identityLink, setIdentityLink] = useState(app.identity_link || '')
  const [complianceLink, setComplianceLink] = useState(app.compliance_link || '')
  const [savingLinks, setSavingLinks] = useState(false)
  const [sendingIdentity, setSendingIdentity] = useState(false)
  const [sendingCompliance, setSendingCompliance] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const [sendingNotify, setSendingNotify] = useState(false)
  const [emailLogs, setEmailLogs] = useState([])

  useEffect(() => {
    fetchEmailLogs(app.id).then(setEmailLogs).catch(() => {})
  }, [app.id])

  const refreshLogs = () => fetchEmailLogs(app.id).then(setEmailLogs).catch(() => {})

  const sendWelcome = async () => {
    setSendingWelcome(true)
    try {
      await sendWelcomeEmail(app)
      toast.success(`Welcome email sent to ${app.email}`)
      refreshLogs()
    } catch { toast.error('Welcome email failed to send. Please try again.') }
    setSendingWelcome(false)
  }

  const saveLinks = async () => {
    setSavingLinks(true)
    try {
      await updateVerificationLinks(app.id, identityLink, complianceLink)
      onLinksChange?.(app.id, identityLink, complianceLink)
      toast.success('Links saved')
    } catch { toast.error('Failed to save verification links. Please try again.') }
    setSavingLinks(false)
  }

  const sendIdentityEmail = async () => {
    setSendingIdentity(true)
    try {
      await updateVerificationLinks(app.id, identityLink, complianceLink)
      onLinksChange?.(app.id, identityLink, complianceLink)
      await sendIdentityVerificationEmail(app, identityLink)
      toast.success(`Identity verification email sent to ${app.email}`)
      refreshLogs()
    } catch { toast.error('Identity verification email failed to send. Please try again.') }
    setSendingIdentity(false)
  }

  const sendComplianceEmail = async () => {
    setSendingCompliance(true)
    try {
      await updateVerificationLinks(app.id, identityLink, complianceLink)
      onLinksChange?.(app.id, identityLink, complianceLink)
      await sendComplianceVerificationEmail(app, complianceLink)
      toast.success(`Compliance verification email sent to ${app.email}`)
      refreshLogs()
    } catch { toast.error('Compliance verification email failed to send. Please try again.') }
    setSendingCompliance(false)
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
    } catch { toast.error('Could not download CV. Please try again.') }
    setDownloading(false)
  }

  const changeStatus = async (status) => {
    setStatusLoading(true)
    await onStatusChange(app.id, status, app)
    toast.info(`Status updated to ${STATUS_COLORS[status]?.label} — candidate not notified yet`)
    setStatusLoading(false)
  }

  const notifyCandidate = async () => {
    const lastSameLog = emailLogs.find(l => l.email_type === `status_${app.status}` && l.status === 'sent')
    if (lastSameLog) {
      const mins = (Date.now() - new Date(lastSameLog.sent_at).getTime()) / 60000
      if (mins < 120 && !window.confirm(`${STATUS_COLORS[app.status]?.label} email was already sent ${formatRelativeDate(lastSameLog.sent_at)}. Send again?`)) return
    }
    setSendingNotify(true)
    try {
      await sendStatusEmail(app.status, app)
      toast.success(`${app.first_name} notified — ${STATUS_COLORS[app.status]?.label} email sent`)
      refreshLogs()
    } catch { toast.error('Email failed to send. Please try again.') }
    setSendingNotify(false)
  }

  const sc             = STATUS_COLORS[app.status] || STATUS_COLORS.applied
  const lastNotify     = emailLogs.find(l => l.email_type === `status_${app.status}`)
  const identitySent   = emailLogs.find(l => l.email_type === 'identity_verification'   && l.status === 'sent')
  const complianceSent = emailLogs.find(l => l.email_type === 'compliance_verification' && l.status === 'sent')
  const welcomeSent    = emailLogs.find(l => l.email_type === 'welcome'                 && l.status === 'sent')

  return (
    <motion.div className={styles.drawer}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>

      <div className={styles.drawerHead}>
        <div>
          <div className={styles.drawerRole}>
            {app.job_title} · {app.job_dept}
            {app.source === 'sourced' && <span className={styles.sourcedBadge} style={{ marginLeft: 8 }}>Sourced</span>}
          </div>
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
          {statusLoading && <div className={styles.statusHint}>Updating…</div>}

          {app.status !== 'applied' && (
            <>
              <button className={styles.notifyBtn} onClick={notifyCandidate} disabled={sendingNotify} style={{ marginTop: 14 }}>
                {sendingNotify
                  ? <><div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Sending…</>
                  : <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Notify {app.first_name} — {STATUS_COLORS[app.status]?.label}
                    </>}
              </button>
              {lastNotify && (
                <div className={styles.verifyHint} style={{
                  color: lastNotify.status === 'sent' ? STATUS_COLORS[app.status]?.color : '#E24B4A'
                }}>
                  {lastNotify.status === 'sent'
                    ? `✓ Sent ${formatRelativeDate(lastNotify.sent_at)}`
                    : `✗ Failed ${formatRelativeDate(lastNotify.sent_at)}`}
                </div>
              )}
            </>
          )}

          <div className={styles.verifyBlock}>
            <div className={styles.statusLabel} style={{ marginBottom: 10 }}>Verification</div>
            <div className={styles.verifyRow}>
              <span className={styles.verifyTag} style={{ color: identitySent ? '#5a8f1a' : identityLink ? 'var(--tm)' : 'var(--td)' }}>ID</span>
              <input className={styles.verifyInline} value={identityLink} onChange={e => setIdentityLink(e.target.value)} placeholder="Paste identity link…" />
              <button className={styles.verifyInlineBtn} onClick={sendIdentityEmail} disabled={!identityLink || sendingIdentity} title="Send identity verification email">
                {sendingIdentity
                  ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>
            {identitySent && (
              <div className={styles.verifyHint} style={{ color: '#5a8f1a' }}>
                ✓ Sent {formatRelativeDate(identitySent.sent_at)}
              </div>
            )}
            <div className={styles.verifyRow} style={{ marginTop: identitySent ? 10 : 6 }}>
              <span className={styles.verifyTag} style={{ color: complianceSent ? '#378add' : complianceLink ? 'var(--tm)' : 'var(--td)' }}>CO</span>
              <input className={styles.verifyInline} value={complianceLink} onChange={e => setComplianceLink(e.target.value)} placeholder="Paste compliance link…" />
              <button className={styles.verifyInlineBtn} onClick={sendComplianceEmail} disabled={!complianceLink || sendingCompliance} title="Send compliance verification email">
                {sendingCompliance
                  ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>
            {complianceSent && (
              <div className={styles.verifyHint} style={{ color: '#378add' }}>
                ✓ Sent {formatRelativeDate(complianceSent.sent_at)}
              </div>
            )}
            <button className={styles.saveBtn} onClick={saveLinks} disabled={savingLinks} style={{ marginTop: 10 }}>
              {savingLinks ? 'Saving…' : 'Save Links'}
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Personal Details</div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span>Email</span><strong>{app.email || '—'}</strong></div>
            <div className={styles.detailItem}><span>Date of Birth</span><strong>{app.dob ? new Date(app.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</strong></div>
            <div className={styles.detailItem}><span>Country</span><strong>{app.country || '—'}</strong></div>
            <div className={styles.detailItem}><span>City</span><strong>{app.city || '—'}</strong></div>
            <div className={styles.detailItem}><span>State</span><strong>{app.state || '—'}</strong></div>
            <div className={styles.detailItem}><span>Postcode</span><strong>{app.zip || '—'}</strong></div>
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

        {app.source === 'sourced' && (
          <>
            <div className={styles.divider} />
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Welcome Email</div>
              <p style={{ fontSize: 12, color: 'var(--td)', margin: '0 0 12px', fontFamily: "'Raleway', sans-serif", lineHeight: 1.6 }}>
                Send this candidate a personalised welcome email introducing Arcvoy and their selection.
              </p>
              <button className={styles.welcomeBtn} onClick={sendWelcome} disabled={sendingWelcome}>
                {sendingWelcome ? 'Sending…' : 'Send Welcome Email'}
              </button>
              {welcomeSent && (
                <div className={styles.verifyHint} style={{ color: '#cc6633', marginTop: 8 }}>
                  ✓ Sent {formatRelativeDate(welcomeSent.sent_at)}
                </div>
              )}
            </div>
          </>
        )}

        {emailLogs.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Email History</div>
              <div className={styles.emailLogList}>
                {emailLogs.slice(0, 8).map(log => (
                  <div key={log.id} className={styles.emailLogRow}>
                    <span className={`${styles.emailLogDot} ${log.status === 'sent' ? styles.emailLogDotSent : styles.emailLogDotFailed}`} title={log.status} />
                    <span className={styles.emailLogType}>{EMAIL_TYPE_LABELS[log.email_type] || log.email_type}</span>
                    <span className={styles.emailLogDate}>{formatRelativeDate(log.sent_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

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

/* ── Overview / Stats View ── */
function OverviewView({ apps }) {
  const [period, setPeriod] = useState('all')
  const [jobs, setJobs] = useState([])
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const [{ data: j }, { data: t }] = await Promise.all([
          supabase.from('jobs').select('id,active'),
          supabase.from('tickets').select('id,status'),
        ])
        setJobs(j || [])
        setTickets(t || [])
      } catch {
        setJobs([])
        setTickets([])
      }
    }
    load()
  }, [])

  const cutoff = period === 'all' ? null : new Date(Date.now() - parseInt(period) * 86400000)
  const filtered = cutoff ? apps.filter(a => new Date(a.created_at) >= cutoff) : apps

  const total = filtered.length
  const sourced = filtered.filter(a => a.source === 'sourced').length
  const hired = filtered.filter(a => a.status === 'hired').length
  const activeJobs = jobs.filter(j => j.active).length
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  const pipeline = STATUS_ORDER.map(s => ({
    key: s,
    label: STATUS_COLORS[s].label,
    color: STATUS_COLORS[s].color,
    count: filtered.filter(a => a.status === s).length,
  }))

  const recent = [...apps]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  return (
    <div className={styles.overviewWrap}>
      <div className={styles.overviewHead}>
        <div>
          <div className={styles.mainTitle}>Overview</div>
          <div className={styles.mainSub}>Platform at a glance</div>
        </div>
        <select className={styles.periodSelect} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: 'Total Applications', value: total, sub: period === 'all' ? 'all time' : `last ${period} days` },
          { label: 'Sourced Candidates', value: sourced, sub: total > 0 ? `${Math.round(sourced / total * 100)}% of total` : '—' },
          { label: 'Active Jobs', value: activeJobs, sub: `${jobs.length} total posted` },
          { label: 'Open Tickets', value: openTickets, sub: `${tickets.length} total tickets` },
          { label: 'Hired', value: hired, sub: total > 0 ? `${Math.round(hired / total * 100)}% conversion` : '—' },
        ].map(card => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statValue}>{card.value}</div>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={styles.statSub}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.overviewSection}>
        <div className={styles.overviewSectionTitle}>Pipeline Breakdown</div>
        <div className={styles.pipelineGrid}>
          {pipeline.map(p => (
            <div key={p.key} className={styles.pipelineCard}>
              <div className={styles.pipelineCount} style={{ color: p.color }}>{p.count}</div>
              <div className={styles.pipelineBar}>
                <div className={styles.pipelineBarFill} style={{
                  width: total > 0 ? `${Math.max(p.count > 0 ? 6 : 0, Math.round(p.count / total * 100))}%` : '0%',
                  background: p.color,
                }} />
              </div>
              <div className={styles.pipelineLabel}>{p.label}</div>
              <div className={styles.pipelinePct}>{total > 0 ? `${Math.round(p.count / total * 100)}%` : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.overviewSection}>
        <div className={styles.overviewSectionTitle}>Recent Applications</div>
        <div className={styles.recentList}>
          {recent.length === 0 ? (
            <div className={styles.empty}>No applications yet.</div>
          ) : recent.map(app => {
            const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied
            return (
              <div key={app.id} className={styles.recentItem}>
                <div className={styles.avatar} style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                  {app.first_name?.[0] || '?'}{app.last_name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.tdNameMain}>
                    {app.first_name} {app.last_name}
                    {app.source === 'sourced' && <span className={styles.sourcedBadge} style={{ marginLeft: 7 }}>Sourced</span>}
                  </div>
                  <div className={styles.tdNameSub}>{app.job_title}</div>
                </div>
                <span className={styles.statusPill} style={{ background: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                <span className={styles.tdDate} style={{ flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
                  {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Applications View ── */
function ApplicationsView({ apps, loading }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [apps_, setApps] = useState(apps)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', jobId: '' })
  const [addJobs, setAddJobs] = useState([])
  const [addSaving, setAddSaving] = useState(false)

  useEffect(() => { setApps(apps) }, [apps])

  const openAddModal = async () => {
    setAddForm({ firstName: '', lastName: '', email: '', jobId: '' })
    setShowAddModal(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { data } = await supabase.from('jobs').select('id,title,dept,type').eq('active', true).order('created_at', { ascending: true })
      setAddJobs(data || [])
    } catch { setAddJobs([]) }
  }

  const submitAddCandidate = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.jobId) return
    setAddSaving(true)
    try {
      const job = addJobs.find(j => j.id === addForm.jobId)
      const result = await createSourcedApplication({
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        job,
      })
      setApps(prev => [{
        id: result.id,
        first_name: addForm.firstName,
        last_name: addForm.lastName,
        email: addForm.email,
        job_id: job.id,
        job_title: job.title,
        job_dept: job.dept,
        job_type: job.type,
        status: 'applied',
        source: 'sourced',
        created_at: new Date().toISOString(),
      }, ...prev])
      setShowAddModal(false)
    } catch (e) { toast.error(e.message || 'Failed to add candidate. Please try again.') }
    setAddSaving(false)
  }

  const onStatusChange = async (id, status) => {
    await updateStatus(id, status)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const onNotesChange = async (id, notes) => {
    await updateNotes(id, notes)
    setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a))
  }

  const onLinksChange = (id, identityLink, complianceLink) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, identity_link: identityLink, compliance_link: complianceLink } : a))
    if (selected?.id === id) setSelected(prev => ({ ...prev, identity_link: identityLink, compliance_link: complianceLink }))
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
            <button className={styles.addBtn} onClick={openAddModal}>+ Add Candidate</button>
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
          <div className={styles.table}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.trow} style={{ cursor: 'default', opacity: 1 - i * 0.13, pointerEvents: 'none' }}>
                <span className={styles.tdName}>
                  <div className={styles.skeleton} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className={styles.skeleton} style={{ height: 13, width: '55%' }} />
                    <div className={styles.skeleton} style={{ height: 11, width: '75%' }} />
                  </div>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className={styles.skeleton} style={{ height: 13, width: '65%' }} />
                  <div className={styles.skeleton} style={{ height: 10, width: '40%' }} />
                </span>
                <span><div className={styles.skeleton} style={{ height: 22, width: 64, borderRadius: 2 }} /></span>
                <span><div className={styles.skeleton} style={{ height: 13, width: 38 }} /></span>
                <span /><span /><span />
              </div>
            ))}
          </div>
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
              <span>Verified</span>
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
                      <div className={styles.tdNameMain}>
                        {app.first_name} {app.last_name}
                        {app.source === 'sourced' && <span className={styles.sourcedBadge} style={{ marginLeft: 7 }}>Sourced</span>}
                      </div>
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
                  <span className={styles.verifyDots}>
                    <span className={styles.verifyDot} title="Identity" style={{ background: app.identity_link ? '#5a8f1a' : 'var(--bd2)' }} />
                    <span className={styles.verifyDot} title="Compliance" style={{ background: app.compliance_link ? '#378add' : 'var(--bd2)' }} />
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
            onLinksChange={onLinksChange}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div className={styles.jobFormOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
            <motion.div className={styles.jobForm}
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}>
              <div className={styles.jobFormHead}>
                <div className={styles.sectionTitle}>Add Candidate</div>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                  </svg>
                </button>
              </div>
              <div className={styles.jobFormBody}>
                <div className={styles.field}>
                  <label className="fl">First Name *</label>
                  <input className="fi" value={addForm.firstName} placeholder="e.g. Sarah"
                    onChange={e => setAddForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className="fl">Last Name *</label>
                  <input className="fi" value={addForm.lastName} placeholder="e.g. Johnson"
                    onChange={e => setAddForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className="fl">Email *</label>
                  <input className="fi" type="email" value={addForm.email} placeholder="e.g. sarah@example.com"
                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className="fl">Role *</label>
                  <select className="fi" value={addForm.jobId}
                    onChange={e => setAddForm(p => ({ ...p, jobId: e.target.value }))}>
                    <option value="">Select a role…</option>
                    {addJobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} — {j.dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.jobFormFooter}>
                <button className="btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="sub-btn" onClick={submitAddCandidate}
                  disabled={addSaving || !addForm.firstName || !addForm.lastName || !addForm.email || !addForm.jobId}>
                  {addSaving ? 'Adding…' : 'Add Candidate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
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
  const [blastSubject, setBlastSubject] = useState('')
  const [blastBody, setBlastBody] = useState('')
  const [blastSending, setBlastSending] = useState(false)

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

  const sendBlast = async () => {
    if (!blastSubject.trim() || !blastBody.trim() || subscribers.length === 0) return
    setBlastSending(true)
    try {
      const { sent, failed } = await sendBlastEmail(blastSubject, blastBody, subscribers)
      if (failed === 0) {
        toast.success(`Sent to ${sent} subscriber${sent !== 1 ? 's' : ''}`)
      } else {
        toast.info(`Sent to ${sent}, failed for ${failed}`)
      }
      setBlastSubject('')
      setBlastBody('')
    } catch { toast.error('Email blast failed. Please try again.') }
    setBlastSending(false)
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

        <div style={{ padding: '20px 28px 0' }}>
          <div className={styles.blastBox}>
            <div className={styles.blastTitle}>Send to All Subscribers</div>
            <input className="fi" placeholder="Subject line…" value={blastSubject}
              onChange={e => setBlastSubject(e.target.value)} />
            <textarea className={styles.blastTextarea} placeholder="Write your message…"
              value={blastBody} onChange={e => setBlastBody(e.target.value)} rows={4} />
            <div className={styles.blastFooter}>
              <span className={styles.blastCount}>{subscribers.length} recipient{subscribers.length !== 1 ? 's' : ''}</span>
              <button className={styles.blastBtn} onClick={sendBlast}
                disabled={blastSending || !blastSubject.trim() || !blastBody.trim() || subscribers.length === 0}>
                {blastSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
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
    } catch { toast.error('Failed to save job. Please try again.') }
    setSaving(false)
  }

  const toggle = async (j) => {
    await updateJob(j.id, { ...j, desc: j.description, reqs: (j.reqs||[]).join(', '), bonus: (j.bonus||[]).join(', '), locations: (j.locations||[]).join(', '), active: !j.active })
    await load()
  }

  const COLS = '2fr 1fr 1fr 1fr 0.8fr 100px'

  return (
    <div className={styles.dashboard}>
      <div className={styles.main}>
        <div className={styles.mainHead}>
          <div>
            <div className={styles.mainTitle}>Jobs</div>
            <div className={styles.mainSub}>{jobs.length} total</div>
          </div>
          <button className={styles.addBtn} onClick={openNew}>+ Add Job</button>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div className={styles.empty}>No jobs yet.</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.thead} style={{ gridTemplateColumns: COLS }}>
              <span>Title</span>
              <span>Department</span>
              <span>Type</span>
              <span>Salary</span>
              <span>Status</span>
              <span></span>
            </div>
            {jobs.map(j => (
              <div key={j.id} className={styles.trow}
                style={{ gridTemplateColumns: COLS, opacity: j.active ? 1 : 0.5, cursor: 'default' }}>
                <span>
                  <div className={styles.tdNameMain}>{j.title}</div>
                  {j.locations?.length > 0 && <div className={styles.tdDept}>{j.locations.join(', ')}</div>}
                </span>
                <span className={styles.tdRole}>{j.dept}</span>
                <span className={styles.tdDept}>{j.type}</span>
                <span className={styles.tdDate}>{j.salary || '—'}</span>
                <span>
                  <span className={styles.statusPill} style={{ background: j.active ? 'rgba(90,143,26,0.14)' : 'rgba(226,75,74,0.14)', color: j.active ? '#5a8f1a' : '#E24B4A' }}>
                    {j.active ? 'Active' : 'Hidden'}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button className={styles.editBtn} onClick={() => openEdit(j)}>Edit</button>
                  <button className={styles.editBtn} onClick={() => toggle(j)}>{j.active ? 'Hide' : 'Show'}</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
  const { theme, toggle: toggleTheme } = useTheme()
  const [session, setSession] = useState(null)
  const [apps, setApps] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview')
  const [newApps, setNewApps] = useState(0)

  const loadApps = useCallback(async () => {
    setAppsLoading(true)
    try { setApps(await fetchApplications()) } catch (e) { console.error(e) }
    setAppsLoading(false)
  }, [])

  useEffect(() => {
    getAdminSession()
      .then(s => {
        setSession(s)
        if (s) loadApps()
        else setAppsLoading(false)
      })
      .catch(() => setAppsLoading(false))
  }, [loadApps])

  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('admin-new-apps')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, () => {
        if (activeView === 'applications') {
          loadApps()
        } else {
          setNewApps(prev => prev + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session, activeView, loadApps])

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}>
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
            <div className={styles.topBrand}>
              <span className={styles.topBrandMark}>
                <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
                  <path d="M10 50 Q32 6 54 50" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M22 37 L42 37" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                  <circle cx="54" cy="50" r="3.5" fill="currentColor"/>
                </svg>
              </span>
              <span className={styles.topBrandText}>Arcvoy</span>
              <span className={styles.topBrandSub}>Admin</span>
            </div>

            <div className={styles.topTabs}>
              {[
                { key: 'overview',     label: 'Overview' },
                { key: 'applications', label: 'Applications' },
                { key: 'tickets',      label: 'Tickets' },
                { key: 'subscribers',  label: 'Subscribers' },
                { key: 'jobs',         label: 'Jobs' },
              ].map(tab => (
                <button key={tab.key}
                  className={`${styles.topTab} ${activeView === tab.key ? styles.topTabActive : ''}`}
                  onClick={() => {
                    setActiveView(tab.key)
                    if (tab.key === 'applications') { setNewApps(0); loadApps() }
                  }}>
                  {tab.label}
                  {tab.key === 'applications' && newApps > 0 && (
                    <span className={styles.tabBadge}>{newApps}</span>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.navRight}>
              <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
            </div>
          </div>

          {/* Content */}
          <div className={styles.viewWrap}>
            {activeView === 'overview'     && <OverviewView apps={apps} />}
            {activeView === 'applications' && <ApplicationsView apps={apps} loading={appsLoading} />}
            {activeView === 'tickets'      && <TicketsView />}
            {activeView === 'subscribers'  && <SubscribersView />}
            {activeView === 'jobs'         && <JobsView />}
          </div>

        </div>
    </div>
  )
}
