import styles from './Sponsors.module.css'

const SECTORS = [
  { name: 'Generative AI',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/></svg> },
  { name: 'Search & Discovery',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { name: 'Data Annotation',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { name: 'Content Moderation',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { name: 'AI Safety',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { name: 'ML Infrastructure',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
  { name: 'Conversational AI',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { name: 'Enterprise SaaS',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { name: 'FinTech',             icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { name: 'Computer Vision',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
]

const SIGNALS = [
  { text: 'Every application reviewed by a real person', dot: true },
  { text: 'Contributors in 40+ countries',           dot: true },
  { text: 'Weekly payments via bank transfer',       dot: true },
  { text: 'Every application reviewed by a person', dot: true },
  { text: '$20–$25 / hr across all AI roles',       dot: true },
  { text: '100% remote — work from anywhere',       dot: true },
  { text: 'No automated rejections',                dot: true },
  { text: 'Clear onboarding, no guessing',          dot: true },
]

const ROW1 = [...SECTORS, ...SECTORS]
const ROW2 = [...SIGNALS, ...SIGNALS]

export default function Sponsors() {
  return (
    <section className={styles.section}>
      <p className={styles.label}>Placing talent across the industries building AI</p>

      <div className={styles.wrapper}>
        <div className={styles.track}>
          {ROW1.map(({ name, icon }, i) => (
            <div key={`s-${i}`} className={styles.item}>
              <span className={styles.icon}>{icon}</span>
              <span className={styles.name}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.dividerLine} />

      <div className={styles.wrapper}>
        <div className={`${styles.track} ${styles.trackReverse}`}>
          {ROW2.map(({ text }, i) => (
            <div key={`t-${i}`} className={styles.signal}>
              <span className={styles.signalDot} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
