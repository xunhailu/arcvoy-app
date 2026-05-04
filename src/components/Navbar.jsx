import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  ['home', 'Home'],
  ['about', 'About'],
  ['jobs', 'Careers'],
  ['faq', 'FAQ'],
  ['helpdesk', 'Help Desk'],
]

export default function Navbar({ theme, onToggleTheme, onShowLogin, onShowCandidateAuth, page, onNavigate, user }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const nav = (p) => { onNavigate(p); setMenuOpen(false) }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0]
  const initials    = displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?' : '?'

  return (
    <>
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.shimmer} />

      {/* brand */}
      <button className={styles.brand} onClick={() => nav('home')}>
        <motion.span className={styles.brandMark}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0, 0, 1] }}>
          <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
            <path className={styles.brandArc} d="M10 50 Q32 6 54 50" stroke="#cc6633" strokeWidth="5" strokeLinecap="round"/>
            <path className={styles.brandBridge} d="M22 37 L42 37" stroke="#cc6633" strokeWidth="5" strokeLinecap="round"/>
            <circle className={styles.brandDot} cx="54" cy="50" r="3.5" fill="#cc6633"/>
          </svg>
        </motion.span>
        <span className={styles.brandText}>Arcvoy</span>
      </button>

      {/* nav links — glass pill, truly centred */}
      <div className={styles.links}>
        {NAV_ITEMS.map(([key, label]) => (
          <button key={key} className={`${styles.link} ${page === key ? styles.active : ''}`} onClick={() => nav(key)}>
            {page === key && (
              <motion.span
                className={styles.activePill}
                layoutId="nav-active-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={styles.linkLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* right side */}
      <div className={styles.right}>
        {/* theme toggle */}
        <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* candidate — avatar pill if logged in, otherwise Sign In button */}
        {user ? (
          <button className={styles.avatarBtn} onClick={() => nav('dashboard')} title="My Dashboard">
            <div className={styles.avatarPill}>
              <div className={styles.avatarRing}>{initials}</div>
              <span className={styles.avatarName}>{displayName}</span>
            </div>
          </button>
        ) : (
          <button className={styles.navBtn} onClick={onShowCandidateAuth}>Sign In</button>
        )}


        {/* hamburger — mobile only */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Menu" aria-expanded={menuOpen}>
          <span className={`${styles.hLine} ${menuOpen ? styles.hLine1Open : ''}`} />
          <span className={`${styles.hLine} ${menuOpen ? styles.hLine2Open : ''}`} />
          <span className={`${styles.hLine} ${menuOpen ? styles.hLine3Open : ''}`} />
        </button>
      </div>
    </nav>

    {/* mobile menu */}
    <AnimatePresence>
      {menuOpen && (
      <motion.div
        className={styles.mobileMenu}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}>
        {NAV_ITEMS.map(([p, label]) => (
          <button key={p}
            className={`${styles.mobileLink} ${page === p ? styles.mobileLinkActive : ''}`}
            onClick={() => { nav(p); setMenuOpen(false) }}>
            {label}
          </button>
        ))}
        <div className={styles.mobileDivider} />
        {user ? (
          <button className={styles.mobileLink} onClick={() => { nav('dashboard'); setMenuOpen(false) }}>My Dashboard</button>
        ) : (
          <button className={styles.mobileLink} onClick={() => { onShowCandidateAuth(); setMenuOpen(false) }}>Sign In</button>
        )}
      </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
