import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JobCard from '../components/JobCard'
import { fetchJobs } from '../lib/jobs'
import { useBookmarks } from '../hooks/useBookmarks'
import styles from './Jobs.module.css'

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

export default function Jobs() {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [deptFilter, setDeptFilter] = useState(new Set())
  const [typeFilter, setTypeFilter] = useState(new Set())
  const [sort, setSort]           = useState('def')
  const [showSaved, setShowSaved] = useState(false)
  const [jobs, setJobs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [stuck, setStuck]         = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const { saved, toggle, isBookmarked } = useBookmarks()

  useEffect(() => {
    fetchJobs().then(setJobs).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fn = () => { setStuck(window.scrollY > 160); setShowSticky(window.scrollY > 480) }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const depts = [...new Set(jobs.map(j => j.dept))]
  const types = [...new Set(jobs.map(j => j.type))]

  const toggle_ = (set, setFn, val) => setFn(prev => {
    const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n
  })

  const filtered = useMemo(() => {
    let list = jobs.filter(j => {
      const q = search.toLowerCase()
      return (
        (!q || j.title.toLowerCase().includes(q) || (j.reqs||[]).some(r => r.toLowerCase().includes(q))) &&
        (deptFilter.size === 0 || deptFilter.has(j.dept)) &&
        (typeFilter.size === 0 || typeFilter.has(j.type)) &&
        (!showSaved || saved.has(j.id))
      )
    })
    if (sort === 'az')   list = [...list].sort((a,b) => a.title.localeCompare(b.title))
    if (sort === 'dept') list = [...list].sort((a,b) => a.dept.localeCompare(b.dept))
    return list
  }, [jobs, search, deptFilter, typeFilter, sort, showSaved, saved])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(j => { (g[j.dept] = g[j.dept] || []).push(j) })
    return g
  }, [filtered])

  const activeFilters = deptFilter.size + typeFilter.size + (showSaved ? 1 : 0) + (search ? 1 : 0)

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid} />

        <div className={styles.heroInner}>
          <motion.div className={styles.heroTop}
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <span className={styles.heroLabel}>Now Hiring · AI Specialists</span>
            <span className={styles.heroCount}>{loading ? '—' : jobs.length} open roles</span>
          </motion.div>

          <motion.h1 className={styles.title}
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.75, delay:0.1 }}>
            Find your <em>role</em><br/>at Arcvoy.
          </motion.h1>

          <motion.p className={styles.sub}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.25 }}>
            Specialist roles powering the next generation of AI. $20–$25/hr, fully remote,
            with a personal and direct hiring process.
          </motion.p>

          <motion.div className={styles.statsRow}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.7, delay:0.45 }}>
            {[
              ['$20–$25', 'per hour'],
              ['100%', 'remote'],
              ['40+', 'countries'],
              ['Direct', 'hiring model'],
            ].map(([val, label]) => (
              <div key={label} className={styles.stat}>
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FILTER BAR ══ */}
      <div className={`${styles.bar} ${stuck ? styles.barStuck : ''}`}>
        <div className={styles.barInner}>

          <label className={styles.searchBox}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              placeholder="Search roles or skills…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>×</button>
            )}
          </label>

          <div className={styles.sep} />

          <div className={styles.pills}>
            <button className={`${styles.pill} ${activeFilters === 0 ? styles.pillOn : ''}`}
              onClick={() => { setDeptFilter(new Set()); setTypeFilter(new Set()); setShowSaved(false); setSearch('') }}>
              All
            </button>
            {depts.map(d => (
              <button key={d} className={`${styles.pill} ${deptFilter.has(d) ? styles.pillOn : ''}`}
                onClick={() => toggle_(deptFilter, setDeptFilter, d)}>{d}</button>
            ))}
            {types.map(t => (
              <button key={t} className={`${styles.pill} ${typeFilter.has(t) ? styles.pillOn : ''}`}
                onClick={() => toggle_(typeFilter, setTypeFilter, t)}>{t}</button>
            ))}
            <button className={`${styles.pill} ${showSaved ? styles.pillOn : ''}`}
              onClick={() => setShowSaved(v => !v)}>
              Saved {saved.size > 0 && <span className={styles.badge}>{saved.size}</span>}
            </button>
          </div>

          <div className={styles.barRight}>
            <span className={styles.tally}>{filtered.length} role{filtered.length !== 1 ? 's' : ''}</span>
            <select className={styles.sort} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="def">Featured</option>
              <option value="az">A – Z</option>
              <option value="dept">Department</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══ LIST ══ */}
      <div className={styles.listWrap}>
        <AnimatePresence mode="wait">

          {loading && (
            <motion.div key="sk" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {[...Array(5)].map((_,i) => (
                <div key={i} className={styles.skRow}>
                  <div className={styles.sk} style={{ width:52, height:20, borderRadius:100 }} />
                  <div className={styles.sk} style={{ width:'26%', height:14, marginLeft:10 }} />
                  <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                    <div className={styles.sk} style={{ width:58, height:20, borderRadius:100 }} />
                    <div className={styles.sk} style={{ width:42, height:20, borderRadius:100 }} />
                    <div className={styles.sk} style={{ width:76, height:34, borderRadius:100 }} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {!loading && filtered.length === 0 && (
            <motion.div key="empty" className={styles.empty}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--td)', marginBottom:20 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className={styles.emptyTitle}>No matching roles</p>
              <p className={styles.emptySub}>Try adjusting your search or clearing the filters.</p>
              <button className="btn-ghost" style={{ marginTop:24, fontSize:10, letterSpacing:'.1em' }}
                onClick={() => { setSearch(''); setDeptFilter(new Set()); setTypeFilter(new Set()); setShowSaved(false) }}>
                Clear all filters
              </button>
            </motion.div>
          )}

          {!loading && filtered.length > 0 && (
            <motion.div key="list" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {Object.entries(grouped).map(([dept, deptJobs], gi) => (
                <div key={dept} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <span className={styles.groupName}>{dept}</span>
                    <span className={styles.groupCount}>{deptJobs.length} {deptJobs.length === 1 ? 'role' : 'roles'}</span>
                  </div>
                  {deptJobs.map((j, i) => (
                    <JobCard key={j.id} job={j} delay={(gi * 2 + i) * 0.04}
                      onClick={() => navigate('/jobs/' + j.id)}
                      onApply={() => navigate('/jobs/' + j.id + '/apply')}
                      isBookmarked={isBookmarked(j.id)}
                      onBookmark={toggle} />
                  ))}
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSticky && (
          <motion.button className={styles.fab}
            initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:80, opacity:0 }}
            transition={{ duration:0.3, ease:[0.25,0,0,1] }}
            onClick={() => filtered.length > 0 && navigate('/jobs/' + filtered[0].id + '/apply')}>
            Apply Now →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
