import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FAQ.module.css'

const FAQS = [
  {
    category: 'Applications',
    items: [
      {
        q: 'How do I apply for a role at Arcvoy?',
        a: 'Head to the Careers page and browse our open positions. Each listing includes a full breakdown of the role, requirements, pay rate, and work type. When you find a role that fits, click "Apply" to open the application panel. Fill in your personal details, upload your CV in PDF or DOCX format, and hit submit. You will receive a confirmation email straight away, and our team will begin reviewing your application within 48 hours.',
      },
      {
        q: 'How long does the review process take?',
        a: 'We commit to reviewing every single application within 48 hours of submission. This is not a formality — our team manually evaluates each candidate against the role requirements. If you are a strong match, you will hear from us with clear next steps. If the role is not the right fit at this time, we will let you know that too. We do not leave applicants waiting without a response.',
      },
      {
        q: 'Can I apply for multiple roles at the same time?',
        a: 'Yes, absolutely. You are welcome to apply for as many open positions as you feel qualified for. Each application is reviewed independently by the team responsible for that role. Applying to multiple positions does not negatively affect your chances in any of them. We recommend tailoring your CV to each role to highlight the most relevant skills and experience.',
      },
      {
        q: 'Do I need prior experience working in AI?',
        a: 'Not for every role. Arcvoy places professionals across a range of functions including data annotation, quality review, research support, content evaluation, and technical operations. Many of these roles require strong analytical thinking, attention to detail, and the ability to follow structured guidelines rather than formal AI credentials. That said, some specialist positions do require specific technical knowledge. Every job listing clearly outlines what is expected, so read the requirements carefully before applying.',
      },
      {
        q: 'What happens after I submit my application?',
        a: 'Once your application is submitted, you will receive an email confirming receipt. Your application moves into our review queue and is assessed by a member of our team. If you progress, you will be contacted with information about the next stage, which may include a brief assessment, a short interview, or a direct onboarding call depending on the role. You can track your application status in real time from your candidate dashboard.',
      },
    ],
  },
  {
    category: 'Pay & Contracts',
    items: [
      {
        q: 'How and when do contributors get paid?',
        a: 'Contributors are paid either every two weeks or monthly, depending on the terms agreed at the point of onboarding. Your payment schedule will be clearly confirmed before you begin work. We support payment via direct bank transfer, PayPal, and Payoneer. All payments are made in US dollars. If you are based outside the United States, your chosen payment provider will handle the currency conversion at the prevailing rate. Payoneer is particularly recommended for international contributors as it offers competitive rates and broad global coverage.',
      },
      {
        q: 'Are these full time or part time roles?',
        a: 'The majority of roles at Arcvoy are flexible, project based contracts. Some projects require as few as 10 hours per week, while others involve up to 40 hours per week during peak phases. The expected time commitment is clearly stated on every job listing before you apply. We understand that many of our contributors work across multiple projects or have other professional commitments, and our structures are designed to accommodate that where possible.',
      },
      {
        q: 'What is the pay rate for Arcvoy roles?',
        a: 'Pay rates range from $20 to $25 per hour for most roles, with some specialist positions commanding higher rates depending on the complexity and expertise required. All rates are published transparently on each individual job listing — there are no hidden tiers or surprises after onboarding. We believe in paying fairly for skilled work, and our rates reflect the quality of contributor we are looking to attract. Your rate will be confirmed in writing before any work commences.',
      },
      {
        q: 'Is there a contract or formal agreement involved?',
        a: 'Yes. Before commencing work on any project, all contributors will be required to sign a contractor agreement that outlines the scope of work, payment terms, confidentiality obligations, and data handling expectations. This protects both you and Arcvoy. The agreement is provided digitally and the process is straightforward. Our team will walk you through it during the onboarding stage.',
      },
    ],
  },
  {
    category: 'Account & Dashboard',
    items: [
      {
        q: 'How do I create a candidate account?',
        a: 'Click the "Sign In" button in the top navigation bar and select the option to create a new account. You will need to provide your email address and set a password. Once registered, your account gives you access to your personal dashboard where you can track application statuses, view updates, and manage your profile. Creating an account is free and takes less than a minute.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the Sign In screen, click the "Forgot password" link and enter your registered email address. You will receive a password reset link within a few minutes. If you do not see the email, check your spam or junk folder. If you continue to have trouble accessing your account, reach out to us directly through the Help Desk and our team will resolve it for you promptly.',
      },
      {
        q: 'Can I track the status of my applications?',
        a: 'Yes. Every application you submit is tracked in your candidate dashboard in real time. You can see exactly where each application stands across the full pipeline: Applied, Under Review, Interview Stage, Offer Extended, and Hired. If an application is unsuccessful, that will be reflected there too. You will also receive email notifications whenever your status changes, so you are never left guessing.',
      },
      {
        q: 'Can I withdraw an application after submitting it?',
        a: 'Yes. If your circumstances change or you no longer wish to be considered for a role, you can withdraw your application from the dashboard as long as it has not yet moved past the initial review stage. Simply find the relevant application and select the withdraw option. Once a role has progressed to interview or offer stage, please contact us directly via the Help Desk so our team can handle it appropriately.',
      },
    ],
  },
  {
    category: 'Remote Work',
    items: [
      {
        q: 'Are all roles fully remote?',
        a: 'The vast majority of roles at Arcvoy are fully remote and open to candidates globally. We work with a contributor network spanning more than 40 countries, and our operations are built around distributed collaboration. A small number of specialist roles may require candidates to be based in a specific region due to client requirements or regulatory considerations. Where this applies, it is always stated clearly in the job listing.',
      },
      {
        q: 'What equipment or setup do I need?',
        a: 'For most roles, all you need is a reliable internet connection and a modern computer capable of running a web browser and standard productivity tools. Some roles may require a minimum internet speed, particularly those involving real time collaboration or media review. Specific technical requirements will be outlined in the job listing and confirmed during onboarding. We do not typically require contributors to purchase specialised hardware.',
      },
      {
        q: 'Do I need to work specific hours or in a specific timezone?',
        a: 'Most of our roles are structured around output and tasks rather than fixed office hours, which means you have significant flexibility in how you organise your working day. Some roles that involve direct interaction with clients or team leads may require you to be available during overlapping hours with a particular region. Any timezone requirements are clearly noted on the job listing so you can assess whether the role suits your location and schedule before applying.',
      },
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
  useEffect(() => {
    if (!query && open && !autoOpen) setOpen(false)
  }, [query, autoOpen])

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
