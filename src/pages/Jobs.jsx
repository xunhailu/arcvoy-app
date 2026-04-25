import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JobCard from '../components/JobCard'
import ApplyPanel from '../components/ApplyPanel'
import { JOBS } from '../data'
import { useBookmarks } from '../hooks/useBookmarks'
import styles from './Jobs.module.css'

/* ── department icons ── */
const DeptIcon = ({ dept }) => {
  if (dept === 'AI') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/>
      <circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/>
    </svg>
  )
  if (dept === 'Support') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
  if (dept === 'Analytics') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  )
}

export default function Jobs({ initialJob, onClearInitial, user }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState(new Set())
  const [typeFilter, setTypeFilter] = useState(new Set())
  const [sort, setSort] = useState('def')
  const [activeJob, setActiveJob] = useState(initialJob || null)
  const [apps, setApps] = useState([])
  const [showSticky, setShowSticky] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const { saved, toggle, isBookmarked } = useBookmarks()

  useEffect(() => {
    onClearInitial?.()
  }, [onClearInitial])

  useEffect(() => {
    const fn = () => setShowSticky(window.scrollY > 320)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const depts = [...new Set(JOBS.map(j => j.dept))]
  const types = [...new Set(JOBS.map(j => j.type))]

  const toggleFilter = (set, setFn, val) => {
    setFn(prev => {
      const next = new Set(prev)
      next.has(val) ? next.delete(val) : next.add(val)
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = JOBS.filter(j => {
      const q = search.toLowerCase()
      const mq = !q || j.title.toLowerCase().includes(q) || j.reqs.some(r => r.toLowerCase().includes(q))
      const md = deptFilter.size === 0 || deptFilter.has(j.dept)
      const mt = typeFilter.size === 0 || typeFilter.has(j.type)
      const ms = !showSaved || saved.has(j.id)
      return mq && md && mt && ms
    })
    if (sort === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'dept') list = [...list].sort((a, b) => a.dept.localeCompare(b.dept))
    return list
  }, [search, deptFilter, typeFilter, sort, showSaved, saved])

  const onSubmit = (app) => setApps(prev => [...prev, { ...app, time: new Date() }])

  return (
    <div className={styles.page}>

      {/* breadcrumb */}
      <div className={styles.breadcrumb}>
        <span className={styles.bcLink} onClick={() => navigate('/')}>Home</span>
        <span className={styles.bcSep}>/</span>
        <span className={styles.bcCurrent}>Careers</span>
      </div>

      {/* jobs hero */}
      <div className={styles.jobsHero}>
        <motion.div className="label" style={{ marginBottom: 14 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          Open Positions
        </motion.div>
        <motion.h2 className={styles.jobsHeroTitle}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          Find your <em>role</em> at Arcvoy
        </motion.h2>
        <motion.p className={styles.jobsHeroSub}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          We're hiring AI Specialists across multiple verticals. Multiple AI roles available from $20–$25/hr — fully remote.
        </motion.p>

        {/* dept quick-filter pills */}
        <motion.div className={styles.deptPills}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          {depts.map(d => (
            <button key={d} className={`${styles.deptPill} ${deptFilter.has(d) ? styles.deptPillActive : ''}`}
              onClick={() => toggleFilter(deptFilter, setDeptFilter, d)}>
              <span className={styles.deptPillIcon}><DeptIcon dept={d} /></span>
              {d}
            </button>
          ))}
        </motion.div>
      </div>

      {/* layout */}
      <div className={styles.layout}>
        {/* sidebar */}
        <aside className={styles.sidebar}>
          <span className={styles.sideLabel}>Search Roles</span>
          <input
            className={styles.searchInput}
            placeholder="Title or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className={styles.filterGroup}>
            <span className={styles.sideLabel}>Department</span>
            {depts.map(d => (
              <span key={d} className={`filter-chip ${deptFilter.has(d) ? 'active' : ''}`}
                onClick={() => toggleFilter(deptFilter, setDeptFilter, d)}>{d}</span>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.sideLabel}>Work Type</span>
            {types.map(t => (
              <span key={t} className={`filter-chip ${typeFilter.has(t) ? 'active' : ''}`}
                onClick={() => toggleFilter(typeFilter, setTypeFilter, t)}>{t}</span>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.sideLabel}>Saved Jobs</span>
            <span
              className={`filter-chip ${showSaved ? 'active' : ''}`}
              onClick={() => setShowSaved(v => !v)}>
              <svg width="10" height="10" viewBox="0 0 24 24"
                fill={showSaved ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginRight: 4, verticalAlign: 'middle' }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              Saved ({saved.size})
            </span>
          </div>

          <div className={styles.sideStats}>
            <span className={styles.sideLabel}>At a Glance</span>
            {[
              ['Open roles', filtered.length],
              ['Pay rate', '$20–$25 / hr'],
              ['Response time', '48 hours'],
              ['Work style', 'Remote'],
            ].map(([k, v]) => (
              <div key={k} className={styles.statRow}>
                <span>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
        </aside>

        {/* main */}
        <main className={styles.main}>
          <div className={styles.toolbar}>
            <span className={styles.count}>{filtered.length} position{filtered.length !== 1 ? 's' : ''}</span>
            <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="def">Sort: Featured</option>
              <option value="az">Sort: A–Z</option>
              <option value="dept">Sort: Department</option>
            </select>
          </div>

          <AnimatePresence mode="wait">
            {filtered.length === 0
              ? <motion.div key="empty" className={styles.empty}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--td)', marginBottom:12 }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <p style={{ color:'var(--tm)', fontSize:14 }}>No roles match your filters.</p>
                  <button className="btn-ghost" style={{ marginTop:12, fontSize:10 }}
                    onClick={() => { setSearch(''); setDeptFilter(new Set()); setTypeFilter(new Set()) }}>
                    Clear filters
                  </button>
                </motion.div>
              : filtered.map((j, i) => (
                  <JobCard key={j.id} job={j} delay={i * 0.08}
                    onClick={() => setActiveJob(j)}
                    isBookmarked={isBookmarked(j.id)}
                    onBookmark={toggle} />
                ))
            }
          </AnimatePresence>
        </main>
      </div>

      {/* sticky apply button */}
      <AnimatePresence>
        {showSticky && !activeJob && (
          <motion.button
            className={styles.stickyApply}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
            onClick={() => filtered.length > 0 && setActiveJob(filtered[0])}>
            Apply Now →
          </motion.button>
        )}
      </AnimatePresence>

      {/* apply overlay */}
      <AnimatePresence>
        {activeJob && (
          <motion.div className="overlay" key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setActiveJob(null)}>
            <motion.div className="side-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}>
              <ApplyPanel job={activeJob} onClose={() => setActiveJob(null)} onSubmit={onSubmit} user={user} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
