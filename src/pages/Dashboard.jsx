import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import styles from './Dashboard.module.css'

const PIPELINE = ['applied', 'reviewing', 'interviewed', 'offered', 'hired']
const STAGE_LABELS = {
  applied:     'Applied',
  reviewing:   'Reviewing',
  interviewed: 'Interviewed',
  offered:     'Offered',
  hired:       'Hired',
}

function getStepState(stage, currentStatus) {
  if (currentStatus === 'rejected') return stage === 'applied' ? 'done' : 'inactive'
  const ci = PIPELINE.indexOf(currentStatus)
  const si = PIPELINE.indexOf(stage)
  if (si < ci)  return 'done'
  if (si === ci) return 'current'
  return 'upcoming'
}

function Timeline({ status }) {
  const isRejected = status === 'rejected'
  return (
    <div className={styles.timeline}>
      {PIPELINE.map((stage, idx) => {
        const state = getStepState(stage, status)
        const nextState = idx < PIPELINE.length - 1 ? getStepState(PIPELINE[idx + 1], status) : null
        return (
          <div key={stage} className={styles.timelineStep}>
            <div className={`${styles.stepDot} ${styles['stepDot_' + state]} ${isRejected && stage === 'applied' ? styles.stepDotRejected : ''}`}>
              {state === 'done' && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {state === 'current' && !isRejected && <div className={styles.stepPulse} />}
            </div>
            <span className={`${styles.stepLabel} ${styles['stepLabel_' + state]}`}>
              {STAGE_LABELS[stage]}
            </span>
            {idx < PIPELINE.length - 1 && (
              <div className={`${styles.stepLine} ${(nextState === 'done' || nextState === 'current') ? styles.stepLineFilled : ''}`} />
            )}
          </div>
        )
      })}
      {isRejected && (
        <div className={styles.rejectedBadge}>Rejected</div>
      )}
    </div>
  )
}

export default function Dashboard({ user, onNavigate }) {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { onNavigate('home'); return }
    const fetchApps = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
        if (error) throw error
        setApps(data || [])
      } catch (err) {
        console.error('Failed to fetch applications:', err)
        setApps([])
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [user, onNavigate])

  const logout = async () => {
    await supabase.auth.signOut()
    onNavigate('home')
  }

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return
    const { error } = await supabase.from('applications').delete().eq('id', id)
    if (error) { alert('Could not withdraw application. Please try again.'); return }
    setApps(prev => prev.filter(a => a.id !== id))
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Candidate'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={styles.page}>

      {/* header */}
      <div className={styles.topBar}>
        <div className={styles.userChip}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={logout} style={{ fontSize: 11 }}>Sign Out</button>
      </div>

      <div className={styles.body}>
        {/* summary cards */}
        <motion.div className={styles.statsRow}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}>
          {[
            { label: 'Total Applied', value: apps.length,
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { label: 'In Progress',   value: apps.filter(a => ['reviewing','interviewed','offered'].includes(a.status)).length,
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Hired',         value: apps.filter(a => a.status === 'hired').length,
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
          ].map((s, i) => (
            <motion.div key={s.label} className={styles.statCard}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}>
              <div className={styles.statIcon}>{s.icon}</div>
              <span className={styles.statNum}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* applications list */}
        <div className={styles.sectionHead}>
          <div className="label">Your Applications</div>
          <button className="btn-ghost" onClick={() => onNavigate('jobs')} style={{ fontSize: 10 }}>Browse More Roles →</button>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading your applications…</div>
        ) : apps.length === 0 ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p>No applications yet. Find a role that fits you.</p>
            <button className="btn-primary" onClick={() => onNavigate('jobs')}>Browse Open Roles →</button>
          </div>
        ) : (
          <div className={styles.list}>
            {apps.map((a, i) => (
              <motion.div key={a.id} className={styles.card}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <div className={styles.role}>{a.job_title}</div>
                    <div className={styles.meta}>{a.job_dept} · {a.job_type}</div>
                    <div className={styles.date}>
                      Applied {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {a.status === 'applied' && (
                    <button
                      className={styles.withdrawBtn}
                      onClick={() => withdraw(a.id)}
                      title="Withdraw application">
                      Withdraw
                    </button>
                  )}
                </div>
                <Timeline status={a.status || 'applied'} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
