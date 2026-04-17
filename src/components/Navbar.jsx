import { useEffect, useState } from 'react'
import BrandMark from './BrandMark'
import styles from './Navbar.module.css'

export default function Navbar({ theme, onToggleTheme, onShowLogin, onShowCandidateAuth, page, onNavigate, user }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0]
  const initials    = displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : null

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.shimmer} />

      {/* brand */}
      <button className={styles.brand} onClick={() => onNavigate('home')}>
        <BrandMark size={28} />
        <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 40, fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1 }}>
          Arcvoy
        </span>
      </button>

      {/* nav links — glass pill */}
      <div className={styles.links}>
        <button className={`${styles.link} ${page === 'home'     ? styles.active : ''}`} onClick={() => onNavigate('home')}>Home</button>
        <button className={`${styles.link} ${page === 'about'    ? styles.active : ''}`} onClick={() => onNavigate('about')}>About</button>
        <button className={`${styles.link} ${page === 'jobs'     ? styles.active : ''}`} onClick={() => onNavigate('jobs')}>Careers</button>
        <button className={`${styles.link} ${page === 'faq'      ? styles.active : ''}`} onClick={() => onNavigate('faq')}>FAQ</button>
        <button className={`${styles.link} ${page === 'helpdesk' ? styles.active : ''}`} onClick={() => onNavigate('helpdesk')}>Help Desk</button>
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
          <button className={styles.avatarBtn} onClick={() => onNavigate('dashboard')} title="My Dashboard">
            <div className={styles.avatarPill}>
              <div className={styles.avatarRing}>{initials}</div>
              <span className={styles.avatarName}>{displayName}</span>
            </div>
          </button>
        ) : (
          <button className={styles.navBtn} onClick={onShowCandidateAuth}>Sign In</button>
        )}

        <button className={styles.navBtn} onClick={onShowLogin}>Admin Login</button>
      </div>
    </nav>
  )
}
