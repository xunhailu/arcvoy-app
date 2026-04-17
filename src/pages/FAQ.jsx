import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FAQ.module.css'

const FAQS = [
  {
    category: 'Applications',
    items: [
      { q: 'How do I apply for a role at Arcvoy?', a: 'Go to the Careers page, browse open positions, and click on any role to open the application panel. Fill in your details, upload your CV, and submit. You\'ll receive a confirmation email immediately.' },
      { q: 'How long does the review process take?', a: 'We review every application within 48 hours. If your profile matches the role requirements, you\'ll hear from our team with next steps. We guarantee a response — no black holes.' },
      { q: 'Can I apply for multiple roles at once?', a: 'Yes. You can apply for as many open positions as you like. Each application is reviewed independently by the relevant team.' },
      { q: 'Do I need prior experience in AI?', a: 'Not necessarily. Many of our roles require strong judgment, attention to detail, and internet proficiency rather than technical AI knowledge. Each job listing states the specific requirements.' },
    ],
  },
  {
    category: 'Pay & Contracts',
    items: [
      { q: 'How and when do I get paid?', a: 'Contributors are paid weekly via direct bank transfer or PayPal. Payment is processed every Friday for hours worked the previous week.' },
      { q: 'Are these full-time or part-time roles?', a: 'Most roles are flexible, project-based contracts. Hours vary by project — some are 10 hrs/week, others up to 40 hrs/week. The listing will specify the expected commitment.' },
      { q: 'What is the pay rate?', a: 'Pay rates range from $18 to $30/hr depending on the role, skill requirements, and project complexity. All rates are clearly listed on each job posting.' },
    ],
  },
  {
    category: 'Account & Access',
    items: [
      { q: 'How do I create a candidate account?', a: 'Click "Sign In" in the top navigation bar, then choose "Create Account". Enter your email and a password. You\'ll receive a confirmation email to activate your account.' },
      { q: 'I forgot my password. How do I reset it?', a: 'On the Sign In screen, use the "Forgot password" option (coming soon) or contact us via the Help Desk with your email address and we\'ll reset it manually within a few hours.' },
      { q: 'Can I track my application status?', a: 'Yes. Once you\'re signed in to your candidate account, go to your Dashboard to see all your applications and their current status in real time.' },
    ],
  },
  {
    category: 'Remote Work',
    items: [
      { q: 'Are all roles fully remote?', a: 'The majority of our roles are fully remote and available worldwide. Some specialist roles may be location-specific — this is always stated in the job listing.' },
      { q: 'What equipment do I need?', a: 'A reliable internet connection and a modern laptop or desktop computer. Most roles do not require any specialised hardware.' },
      { q: 'What timezones do you operate in?', a: 'Our contributor network spans 40+ countries. Most roles are async-friendly, meaning you work on your own schedule. Some client-facing roles may require overlap with specific timezones.' },
    ],
  },
]

/* highlight matching text */
function Highlight({ text, query }) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.hlMark}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/* accordion item */
function AccordionItem({ q, a, query, autoOpen }) {
  const [open, setOpen] = useState(autoOpen)

  // when search clears, collapse
  const prevQuery = useRef(query)
  if (prevQuery.current !== query) {
    prevQuery.current = query
    if (!query && open && !autoOpen) setOpen(false)
  }

  return (
    <div className={`${styles.item} ${open ? styles.itemOpen : ''}`}>
      <button className={styles.question} onClick={() => setOpen(o => !o)}>
        <span><Highlight text={q} query={query} /></span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0, 0, 1] }}>
            <p className={styles.answer}><Highlight text={a} query={query} /></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ({ onNavigate }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  /* debounced query for filtering */
  const query = search.trim().toLowerCase()

  /* filter FAQS live */
  const filtered = useMemo(() => {
    if (!query) return FAQS
    return FAQS
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.q.toLowerCase().includes(query) ||
            item.a.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.items.length > 0)
  }, [query])

  const totalResults = filtered.reduce((sum, s) => sum + s.items.length, 0)

  const clearSearch = () => { setSearch(''); inputRef.current?.focus() }

  return (
    <div className={styles.page}>

      {/* hero */}
      <div className={styles.hero}>
        <motion.div className="label" style={{ marginBottom: 14 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Support
        </motion.div>
        <motion.h1 className={styles.heroTitle}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Frequently Asked<br /><em>Questions</em>
        </motion.h1>
        <motion.p className={styles.heroSub}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          Can't find what you're looking for? Reach us directly via the Help Desk.
        </motion.p>
        <motion.button className="btn-ghost" onClick={() => onNavigate('helpdesk')}
          style={{ marginTop: 8, fontSize: 11 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          Open a Support Ticket →
        </motion.button>
      </div>

      {/* search bar */}
      <motion.div className={styles.searchWrap}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                className={styles.searchClear}
                onClick={clearSearch}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                title="Clear search">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {query && (
            <motion.p className={styles.searchMeta}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {totalResults === 0
                ? 'No results found'
                : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${search.trim()}"`}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* faq body */}
      <div className={styles.body}>
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" className={styles.emptyState}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--td)', marginBottom: 12 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No questions matched <strong>"{search.trim()}"</strong></p>
              <button className="btn-ghost" onClick={clearSearch} style={{ marginTop: 12, fontSize: 11 }}>Clear search</button>
            </motion.div>
          ) : (
            <motion.div key="results">
              {filtered.map((section, si) => (
                <motion.div key={section.category} className={styles.section}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: si * 0.06 }}>
                  <div className={styles.catLabel}>{section.category}</div>
                  <div className={styles.accordion}>
                    {section.items.map((item, i) => (
                      <AccordionItem
                        key={item.q}
                        q={item.q}
                        a={item.a}
                        query={search.trim()}
                        autoOpen={!!query}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* still need help */}
      <motion.div className={styles.helpBanner}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className={styles.helpInner}>
          <h3 className={styles.helpTitle}>Still need <em>help?</em></h3>
          <p className={styles.helpText}>Our support team typically responds within 24 hours. Submit a ticket and we'll get back to you.</p>
          <button className="btn-primary" onClick={() => onNavigate('helpdesk')}>Open a Ticket →</button>
        </div>
      </motion.div>
    </div>
  )
}
