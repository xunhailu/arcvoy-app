import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchJobs } from '../lib/jobs'
import { useBookmarks } from '../hooks/useBookmarks'
import styles from './Jobs.module.css'

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const LocationIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

export default function Jobs() {
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState(new Set())
  const [typeFilter, setTypeFilter] = useState(new Set())
  const [sort, setSort]             = useState('def')
  const [showSaved, setShowSaved]   = useState(false)
  const [jobs, setJobs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [stuck, setStuck]           = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768)
  const { saved, toggle, isBookmarked } = useBookmarks()

  useEffect(() => {
    fetchJobs().then(j => { setJobs(j); setSelectedJob(j[0] ?? null) }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fn = () => { setStuck(window.scrollY > 80) }
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

  // When filters change, keep selectedJob if it's still in list, else pick first
  useEffect(() => {
    if (filtered.length === 0) { setSelectedJob(null); return }
    if (!selectedJob || !filtered.find(j => j.id === selectedJob.id)) {
      setSelectedJob(filtered[0])
    }
  }, [filtered])

  const activeFilters = deptFilter.size + typeFilter.size + (showSaved ? 1 : 0) + (search ? 1 : 0)

  function handleCardClick(job) {
    if (window.innerWidth < 768) {
      navigate('/jobs/' + job.id)
    } else {
      setSelectedJob(job)
    }
  }

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <motion.div className={styles.heroInner}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <span className={styles.heroLabel}>Now Hiring · AI Specialists</span>
          <h1 className={styles.title}>Find your <em>role</em> at Arcvoy.</h1>
          <p className={styles.sub}>
            Specialist roles powering next-gen AI. $20–$25/hr, fully remote, direct hiring.
          </p>
          <div className={styles.heroStats}>
            {[
              [loading ? '—' : String(jobs.length), 'Open Roles'],
              ['$20–$25', 'Per Hour'],
              ['100%', 'Remote'],
              ['40+', 'Countries'],
            ].map(([val, label]) => (
              <div key={label} className={styles.heroStat}>
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
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

          <div className={styles.barDivider} />

          <div className={styles.pillsWrap}>
            <div className={styles.pills}>
              <button
                className={`${styles.pill} ${activeFilters === 0 ? styles.pillOn : ''}`}
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
              <button className={`${styles.pill} ${styles.pillSaved} ${showSaved ? styles.pillOn : ''}`}
                onClick={() => setShowSaved(v => !v)}>
                Saved
                {saved.size > 0 && <span className={styles.badge}>{saved.size}</span>}
              </button>
            </div>
            <div className={styles.pillsFade} />
          </div>

          <div className={styles.barRight}>
            <span className={styles.tally}>
              <strong>{filtered.length}</strong> role{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className={styles.sortWrap}>
              <select className={styles.sort} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="def">Featured</option>
                <option value="az">A – Z</option>
                <option value="dept">Department</option>
              </select>
              <svg className={styles.sortCaret} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* ══ SPLIT PANE ══ */}
      <div className={styles.splitWrap}>

        {/* LEFT — job list */}
        <div className={styles.listPane}>
          <AnimatePresence mode="wait">

            {loading && (
              <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.skCard}>
                    <div className={styles.sk} style={{ width: 56, height: 18, borderRadius: 100 }} />
                    <div className={styles.sk} style={{ width: '70%', height: 14, marginTop: 10 }} />
                    <div className={styles.sk} style={{ width: '45%', height: 11, marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      {[48, 64, 52].map((w, j) => (
                        <div key={j} className={styles.sk} style={{ width: w, height: 20, borderRadius: 100 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {!loading && filtered.length === 0 && (
              <motion.div key="empty" className={styles.empty}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--td)', marginBottom: 16 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p className={styles.emptyTitle}>No matching roles</p>
                <p className={styles.emptySub}>Try adjusting your search or filters.</p>
                <button className="btn-ghost" style={{ marginTop: 20, fontSize: 10, letterSpacing: '.1em' }}
                  onClick={() => { setSearch(''); setDeptFilter(new Set()); setTypeFilter(new Set()); setShowSaved(false) }}>
                  Clear filters
                </button>
              </motion.div>
            )}

            {!loading && filtered.length > 0 && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filtered.map((job, i) => {
                  const active = selectedJob?.id === job.id
                  return (
                    <motion.div
                      key={job.id}
                      className={`${styles.card} ${active ? styles.cardActive : ''}`}
                      onClick={() => handleCardClick(job)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: i * 0.03, ease: [0.25, 0, 0, 1] }}
                    >
                      <span className={styles.cardDept}>{job.dept}</span>

                      <div className={styles.cardTitleRow}>
                        <div className={styles.cardTitle}>{job.title}</div>
                        <span className={styles.cardSalary}>{job.salary}</span>
                      </div>

                      <div className={styles.cardMeta}>
                        {job.locations?.[0] && (
                          <span className={styles.cardMetaItem}><LocationIcon />{job.locations[0]}</span>
                        )}
                        <span className={styles.cardMetaItem}><ClockIcon />{job.type}</span>
                      </div>

                      {job.reqs?.length > 0 && (
                        <div className={styles.cardTags}>
                          {job.reqs.slice(0, 3).map(r => (
                            <span key={r} className={styles.cardTag}>{r}</span>
                          ))}
                          {job.reqs.length > 3 && (
                            <span className={styles.cardTagMore}>+{job.reqs.length - 3}</span>
                          )}
                        </div>
                      )}

                    </motion.div>
                  )
                })}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT — detail panel */}
        <div className={styles.detailPane}>
          <AnimatePresence mode="wait">
            {selectedJob ? (
              <motion.div
                key={selectedJob.id}
                className={styles.detail}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.25, 0, 0, 1] }}
              >
                <div className={styles.detailHeader}>
                  <div className={styles.detailHeaderLeft}>
                    <div className={styles.detailPills}>
                      <span className={styles.detailDeptPill}>{selectedJob.dept}</span>
                      <span className={styles.detailTypePill}>{selectedJob.type}</span>
                    </div>
                    <h2 className={styles.detailTitle}>{selectedJob.title}</h2>
                    <div className={styles.detailSalary}>{selectedJob.salary}</div>
                  </div>

                  <div className={styles.detailHeaderRight}>
                    <div className={styles.detailStatus}>
                      <span className={styles.detailStatusDot} />
                      Open
                    </div>
                    <div className={styles.detailActions}>
                      <motion.button
                        className={`${styles.bookmarkBtn} ${isBookmarked(selectedJob.id) ? styles.bookmarkBtnOn : ''}`}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => toggle(selectedJob.id)}
                        title={isBookmarked(selectedJob.id) ? 'Remove bookmark' : 'Save for later'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24"
                          fill={isBookmarked(selectedJob.id) ? 'currentColor' : 'none'}
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                        {isBookmarked(selectedJob.id) ? 'Saved' : 'Save'}
                      </motion.button>
                      <button
                        className={styles.applyBtn}
                        onClick={() => navigate('/jobs/' + selectedJob.id + '/apply')}
                      >
                        Apply Now →
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.detailMeta}>
                  {selectedJob.locations?.map(loc => (
                    <div key={loc} className={styles.detailMetaRow}>
                      <LocationIcon />
                      <span>{loc}</span>
                    </div>
                  ))}
                  <div className={styles.detailMetaRow}>
                    <ClockIcon />
                    <span>{selectedJob.type}</span>
                  </div>
                </div>

                {selectedJob.reqs?.length > 0 && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionLabel}>Requirements</div>
                    <div className={styles.detailTags}>
                      {selectedJob.reqs.map(r => (
                        <span key={r} className={styles.detailTag}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedJob.desc || selectedJob.description) && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionLabel}>About the Role</div>
                    <p className={styles.detailDesc}>{selectedJob.desc ?? selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.bonus && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionLabel}>Bonus & Benefits</div>
                    <p className={styles.detailDesc}>{selectedJob.bonus}</p>
                  </div>
                )}

              </motion.div>
            ) : !loading && (
              <motion.div className={styles.detailEmpty}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p>Select a role to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
