import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Navbar.module.css'

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
          animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 1.5] }}
          transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.2, 0.72, 1], ease: 'easeInOut' }}>
          <svg width="30" height="29" viewBox="0 0 73 71" fill="none">
            <path d="M0 0 C2.23046875 -0.00390625 2.23046875 -0.00390625 5 1 C6.83422755 3.49673729 8.04464876 6.2453201 9.3125 9.0625 C9.67150391 9.82111328 10.03050781 10.57972656 10.40039062 11.36132812 C11.28335948 13.2332221 12.14387587 15.11567717 13 17 C13.99 11.72 14.98 6.44 16 1 C17.32 1.33 18.64 1.66 20 2 C19.40984815 7.50808397 18.43336231 12.64878069 17 18 C19.7790214 15.37536868 21.98818512 13.01919919 24 9.75 C26 7 26 7 28.75 6.125 C29.4925 6.08375 30.235 6.0425 31 6 C31.7109375 8.2109375 31.7109375 8.2109375 32 11 C30.6015625 13.3515625 30.6015625 13.3515625 28.625 15.625 C25.74841434 18.97718523 25.74841434 18.97718523 24 23 C25.175625 22.67 26.35125 22.34 27.5625 22 C31.5011676 21.0030467 34.95139129 20.83130797 39 21 C38.3046875 22.921875 38.3046875 22.921875 37 25 C34.7578125 25.828125 34.7578125 25.828125 32.125 26.25 C31.26132812 26.39953125 30.39765625 26.5490625 29.5078125 26.703125 C27 27 27 27 23 27 C23 27.66 23 28.32 23 29 C27.95 29 32.9 29 38 29 C38.495 30.98 38.495 30.98 39 33 C34.61078349 34.29477815 31.94228883 33.6054454 27.6875 32.0625 C26.61886719 31.68222656 25.55023438 31.30195312 24.44921875 30.91015625 C23.64097656 30.60980469 22.83273438 30.30945313 22 30 C22.66 30.61875 23.32 31.2375 24 31.875 C26 34 26 34 26 36 C26.5775 36.2475 27.155 36.495 27.75 36.75 C30.32939979 38.18299988 32.06121592 39.78424676 34 42 C34 42.66 34 43.32 34 44 C29.40693504 42.5140084 26.56430755 40.14985318 23 37 C23.66 38.0725 24.32 39.145 25 40.25 C26.88295807 43.30980686 27 44.1335864 27 48 C25.234375 47.84765625 25.234375 47.84765625 23 47 C21.078125 44.49609375 21.078125 44.49609375 19.25 41.4375 C18.63640625 40.42558594 18.0228125 39.41367187 17.390625 38.37109375 C16.70226563 37.19740234 16.70226563 37.19740234 16 36 C15.95101562 36.81984375 15.90203125 37.6396875 15.8515625 38.484375 C15.77679688 39.56203125 15.70203125 40.6396875 15.625 41.75 C15.55539063 42.81734375 15.48578125 43.8846875 15.4140625 44.984375 C15.0271777 47.80206432 14.44313834 49.5830366 13 52 C11.515 51.505 11.515 51.505 10 51 C10.66 45.72 11.32 40.44 12 35 C11.31292969 35.9384375 10.62585938 36.876875 9.91796875 37.84375 C9.00831427 39.06287456 8.09813047 40.28160429 7.1875 41.5 C6.50977539 42.43005859 6.50977539 42.43005859 5.81835938 43.37890625 C4.61664854 44.97533962 3.31346367 46.49417079 2 48 C1.01 48 0.02 48 -1 48 C0.34929464 44.16336928 2.07751025 41.34827431 4.625 38.1875 C5.25664062 37.39730469 5.88828125 36.60710938 6.5390625 35.79296875 C7.02117188 35.20128906 7.50328125 34.60960937 8 34 C4.42403469 35.71198339 1.19995767 37.78659241 -2.09765625 39.9765625 C-4 41 -4 41 -7 41 C-6.64537771 38.22312716 -6.24613432 37.20868995 -4.07421875 35.3671875 C-3.28660156 34.87476563 -2.49898437 34.38234375 -1.6875 33.875 C-0.90761719 33.37742188 -0.12773437 32.87984375 0.67578125 32.3671875 C2.74879023 31.14777045 4.83311354 30.04129555 7 29 C5.97519531 28.95101562 4.95039063 28.90203125 3.89453125 28.8515625 C2.5338294 28.77648929 1.17315356 28.70094345 -0.1875 28.625 C-1.19780273 28.57859375 -1.19780273 28.57859375 -2.22851562 28.53125 C-6.19678975 28.29896078 -9.40729879 27.71612524 -13 26 C-13 25.67 -13 25.34 -13 25 C-6.4 25 0.2 25 7 25 C2.11678161 21.87611034 2.11678161 21.87611034 -2.78295898 18.77832031 C-3.38954346 18.38225586 -3.99612793 17.98619141 -4.62109375 17.578125 C-5.2442749 17.18012695 -5.86745605 16.78212891 -6.50952148 16.37207031 C-8.34015423 14.68686867 -8.61983083 13.42048538 -9 11 C-7.359375 10.25390625 -7.359375 10.25390625 -5 10 C-2.203125 11.65234375 -2.203125 11.65234375 0.75 13.9375 C1.73484375 14.68902344 2.7196875 15.44054688 3.734375 16.21484375 C4.48203125 16.80394531 5.2296875 17.39304687 6 18 C5.57847656 17.26394531 5.15695313 16.52789063 4.72265625 15.76953125 C4.17480469 14.79371094 3.62695312 13.81789063 3.0625 12.8125 C2.51722656 11.84957031 1.97195312 10.88664062 1.41015625 9.89453125 C0.08224095 7.16881038 -0.67327978 5.0027144 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z" fill="currentColor" transform="translate(24,7)"/>
          </svg>
        </motion.span>
        <span className={styles.brandText}>Arcvoy</span>
      </button>

      {/* nav links — glass pill */}
      <div className={styles.links}>
        <button className={`${styles.link} ${page === 'home'     ? styles.active : ''}`} onClick={() => nav('home')}>Home</button>
        <button className={`${styles.link} ${page === 'about'    ? styles.active : ''}`} onClick={() => nav('about')}>About</button>
        <button className={`${styles.link} ${page === 'jobs'     ? styles.active : ''}`} onClick={() => nav('jobs')}>Careers</button>
        <button className={`${styles.link} ${page === 'faq'      ? styles.active : ''}`} onClick={() => nav('faq')}>FAQ</button>
        <button className={`${styles.link} ${page === 'helpdesk' ? styles.active : ''}`} onClick={() => nav('helpdesk')}>Help Desk</button>
      </div>

      {/* right side */}
      <div className={styles.right}>
        {/* theme toggle */}
        <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle theme">
          <div className={`${styles.themeSlider} ${theme === 'light' ? styles.themeSliderLight : ''}`} />
          {/* moon — active in dark */}
          <span className={`${styles.themeIcon} ${theme === 'dark' ? styles.themeIconActive : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </span>
          {/* sun — active in light */}
          <span className={`${styles.themeIcon} ${theme === 'light' ? styles.themeIconActive : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </span>
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

        <button className={`${styles.navBtn} ${styles.adminBtn}`} onClick={onShowLogin}>Employee</button>

        {/* hamburger — mobile only */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Menu" aria-expanded={menuOpen}>
          <span className={`${styles.hLine} ${menuOpen ? styles.hLine1Open : ''}`} />
          <span className={`${styles.hLine} ${menuOpen ? styles.hLine2Open : ''}`} />
          <span className={`${styles.hLine} ${menuOpen ? styles.hLine3Open : ''}`} />
        </button>
      </div>
    </nav>

    {/* mobile menu */}
    {menuOpen && (
      <div className={styles.mobileMenu}>
        {[
          ['home',      'Home'],
          ['about',     'About'],
          ['jobs',      'Careers'],
          ['faq',       'FAQ'],
          ['helpdesk',  'Help Desk'],
        ].map(([p, label]) => (
          <button key={p}
            className={`${styles.mobileLink} ${page === p ? styles.mobileLinkActive : ''}`}
            onClick={() => nav(p)}>
            {label}
          </button>
        ))}
        <div className={styles.mobileDivider} />
        {user ? (
          <button className={styles.mobileLink} onClick={() => nav('dashboard')}>My Dashboard</button>
        ) : (
          <button className={styles.mobileLink} onClick={() => { onShowCandidateAuth(); setMenuOpen(false) }}>Sign In</button>
        )}
        <button className={styles.mobileLink} onClick={() => { onShowLogin(); setMenuOpen(false) }}>Employee Login</button>
      </div>
    )}
    </>
  )
}
