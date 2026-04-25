import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { JOBS } from '../data'
import ApplyPanel from '../components/ApplyPanel'
import { useBookmarks } from '../hooks/useBookmarks'
import { useSEO } from '../hooks/useSEO'
import styles from './JobDetail.module.css'

export default function JobDetail({ user }) {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const jobId       = parseInt(id, 10)
  const job         = !isNaN(jobId) ? JOBS.find(j => j.id === jobId) : null
  const [applying, setApplying] = useState(false)
  const [done, setDone]         = useState(false)
  const { isBookmarked, toggle } = useBookmarks()

  useSEO({
    title: job ? job.title : 'Job Not Found',
    description: job ? `${job.title} at Arcvoy — ${job.type} · ${job.salary}. ${job.desc.slice(0, 120)}…` : null,
  })

  if (!job) return <Navigate to="/jobs" replace />

  const bookmarked = isBookmarked(job.id)

  return (
    <div className={styles.page}>

      {/* breadcrumb */}
      <div className={styles.breadcrumb}>
        <button className={styles.bcLink} onClick={() => navigate('/')}>Home</button>
        <span className={styles.bcSep}>/</span>
        <button className={styles.bcLink} onClick={() => navigate('/jobs')}>Careers</button>
        <span className={styles.bcSep}>/</span>
        <span className={styles.bcCurrent}>{job.title}</span>
      </div>

      <div className={styles.layout}>

        {/* ── main ── */}
        <main className={styles.main}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            <div className={styles.header}>
              <button className={styles.backBtn} onClick={() => navigate('/jobs')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to all roles
              </button>

              <div className={styles.badges}>
                <span className={styles.deptBadge}>{job.dept}</span>
                <span className={styles.typeBadge}>{job.type}</span>
              </div>

              <h1 className={styles.title}>{job.title}</h1>
              <div className={styles.salary}>{job.salary}</div>
            </div>

            <div className={styles.card}>
              {/* gradient top line */}
              <div className={styles.cardLine} />

              <section className={styles.section}>
                <h2 className={styles.secLabel}>About the Role</h2>
                <p className={styles.body}>{job.desc}</p>
              </section>

              <section className={styles.section}>
                <h2 className={styles.secLabel}>What We're Looking For</h2>
                <ul className={styles.list}>
                  {job.reqs.map(r => (
                    <li key={r} className={styles.listItem}>
                      <span className={styles.dot} />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>

              {job.bonus?.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.secLabel}>Nice to Have</h2>
                  <ul className={styles.list}>
                    {job.bonus.map(b => (
                      <li key={b} className={`${styles.listItem} ${styles.listItemBonus}`}>
                        <span className={`${styles.dot} ${styles.dotBonus}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {job.locations?.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.secLabel}>Location</h2>
                  <div className={styles.locTags}>
                    {job.locations.map(loc => (
                      <span key={loc} className={styles.locTag}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {loc}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className={styles.section}>
                <h2 className={styles.secLabel}>Compensation & Terms</h2>
                <div className={styles.terms}>
                  {[
                    ['Pay Rate',      job.salary],
                    ['Work Type',     job.type],
                    ['Contract',      'Flexible / Project-based'],
                    ['Payment',       'Weekly via bank transfer or PayPal'],
                    ['Response',      'Within 48 hours guaranteed'],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.termRow}>
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </main>

        {/* ── sidebar ── */}
        <aside className={styles.sidebar}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}>

            {done ? (
              <div className={styles.applyCard}>
                <div className={styles.successIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className={styles.applyTitle}>Application sent!</div>
                <p className={styles.applyDesc}>We'll review it and get back to you within 48 hours.</p>
              </div>
            ) : (
              <div className={styles.applyCard}>
                <div className={styles.applyTitle}>Ready to apply?</div>
                <p className={styles.applyDesc}>Join our global network. We respond to every application within 48 hours.</p>
                <button className="btn-primary" style={{ width:'100%', marginTop:20 }}
                  onClick={() => setApplying(true)}>
                  Apply for this Role →
                </button>
                <button
                  className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarkBtnSaved : ''}`}
                  onClick={() => toggle(job.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24"
                    fill={bookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  {bookmarked ? 'Saved' : 'Save for Later'}
                </button>
              </div>
            )}

            <div className={styles.infoCard}>
              <div className={styles.infoCardHead}>At a Glance</div>
              {[
                ['Department',  job.dept],
                ['Work Type',   job.type],
                ['Pay Rate',    job.salary],
                ['Response',    '< 48 hours'],
                ['Contract',    'Flexible'],
              ].map(([k, v]) => (
                <div key={k} className={styles.infoRow}>
                  <span>{k}</span><strong>{v}</strong>
                </div>
              ))}
            </div>
          </motion.div>
        </aside>
      </div>

      {/* apply panel overlay */}
      <AnimatePresence>
        {applying && (
          <motion.div className="overlay" key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="side-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>
              <ApplyPanel job={job} onClose={() => setApplying(false)}
                onSubmit={() => { setApplying(false); setDone(true) }} user={user} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
