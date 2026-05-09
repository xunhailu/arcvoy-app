import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { supabase } from '../lib/supabase'
import BrandMark from '../components/BrandMark'
import Particles from '../components/Particles'
import { useTilt } from '../hooks/useTilt'
import { PILLARS, FEATURES, ABOUT_TEXT, HOW_IT_WORKS, TESTIMONIALS } from '../data'
import styles from './Home.module.css'

/* ── feature icons ── */
const IconLightning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const icons = { lightning: <IconLightning/>, globe: <IconGlobe/>, lock: <IconLock/> }

/* ── how it works icons ── */
const IconApply = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconMatch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
)
const IconStart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const howIcons = { apply: <IconApply/>, match: <IconMatch/>, start: <IconStart/> }

/* ── quote icon ── */
const IconQuote = () => (
  <svg viewBox="0 0 32 24" fill="currentColor" width="32" height="24" style={{ opacity: .25 }}>
    <path d="M0 24V14.4C0 6.08 4.48 1.28 13.44 0l1.28 2.56C10.24 3.84 7.68 6.4 7.04 10.24H12V24H0zm20 0V14.4C20 6.08 24.48 1.28 33.44 0l1.28 2.56C30.24 3.84 27.68 6.4 27.04 10.24H32V24H20z"/>
  </svg>
)

/* ── 5-star row ── */
const Stars = () => (
  <div style={{ display:'flex', gap:3, marginBottom:4 }}>
    {[0,1,2,3,4].map(i => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="var(--gd)" style={{ opacity: i < 5 ? 1 : 0.3 }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
)

/* ── typewriter hook — continuous loop ── */
function useTypewriter(lines) {
  const [display, setDisplay] = useState(lines.map(() => ''))
  const [curLine, setCurLine] = useState(0)

  useEffect(() => {
    // all mutable state lives in the closure so we never stale-close over React state
    let lineIdx = 0
    let charIdx = 0
    let phase = 'typing'   // 'typing' | 'pausing' | 'deleting'
    let disp = lines.map(() => '')
    let timeout

    const tick = () => {
      if (phase === 'typing') {
        const line = lines[lineIdx]
        if (charIdx <= line.length) {
          disp = [...disp]
          disp[lineIdx] = line.slice(0, charIdx)
          setDisplay([...disp])
          charIdx++
          timeout = setTimeout(tick, 52)
        } else if (lineIdx < lines.length - 1) {
          // move to next line
          lineIdx++
          charIdx = 0
          setCurLine(lineIdx)
          timeout = setTimeout(tick, 170)
        } else {
          // all lines typed — pause before erasing
          phase = 'pausing'
          timeout = setTimeout(tick, 2400)
        }
      } else if (phase === 'pausing') {
        // begin erasing from last line backward
        phase = 'deleting'
        lineIdx = lines.length - 1
        charIdx = disp[lineIdx].length
        timeout = setTimeout(tick, 40)
      } else {
        // deleting
        if (charIdx >= 0) {
          disp = [...disp]
          disp[lineIdx] = lines[lineIdx].slice(0, charIdx)
          setDisplay([...disp])
          setCurLine(lineIdx)
          charIdx--
          timeout = setTimeout(tick, 28)
        } else if (lineIdx > 0) {
          lineIdx--
          charIdx = disp[lineIdx].length
          timeout = setTimeout(tick, 90)
        } else {
          // fully erased — restart
          phase = 'typing'
          lineIdx = 0
          charIdx = 0
          disp = lines.map(() => '')
          setDisplay([...disp])
          setCurLine(0)
          timeout = setTimeout(tick, 520)
        }
      }
    }

    timeout = setTimeout(tick, 500)
    return () => clearTimeout(timeout)
  }, [lines])

  return { display, curLine }
}

/* ── stat counter ── */
function Counter({ target, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView || target === null) return
    let start = 0
    const dur = 1600
    const step = 16
    const inc = target / (dur / step)
    const timer = setInterval(() => {
      start += inc
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.round(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{target === null ? '∞' : val}{suffix}</span>
}

/* ── socials ── */
// TODO: replace these URLs with your real social profile links
const socials = [
  { label: 'X',         url: 'https://x.com/helloarcvoy',           icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.623zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { label: 'LinkedIn',  url: 'https://linkedin.com/company/arcvoy', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { label: 'Instagram', url: 'https://instagram.com/arcvoy',        icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg> },
]

const CYCLE_PHRASES = ['future of work.', 'future of talent.', 'future of AI.', 'future of growth.']

/* ── TiltCard wrapper ── */
function TiltCard({ children, className, style, ...rest }) {
  const tilt = useTilt(7)
  return (
    <motion.div
      className={className}
      style={{ ...tilt.style, ...style }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...rest}
    >
      <div data-shine style={{ position:'absolute',inset:0,borderRadius:'inherit',pointerEvents:'none',transition:'opacity .3s',opacity:0 }} />
      {children}
    </motion.div>
  )
}

const TW_LINES = ['Build the']

export default function Home({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const subscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    try {
      const { error } = await supabase.from('subscribers').insert([{ email }])
      if (error && error.code !== '23505') throw error
      setEmail('')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3200)
    } catch (err) {
      console.error('Subscribe failed:', err)
    }
  }

  /* typewriter — line 1 only */
  const { display, curLine } = useTypewriter(TW_LINES)

  /* cycling italic phrase */
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [phraseVisible, setPhraseVisible] = useState(true)
  useEffect(() => {
    const id = setInterval(() => {
      setPhraseVisible(false)
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % CYCLE_PHRASES.length)
        setPhraseVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  /* testimonial carousel */
  const [activeT, setActiveT] = useState(0)
  const touchStartX = useRef(0)
  useEffect(() => {
    const id = setInterval(() => setActiveT(i => (i + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <Particles count={typeof window !== 'undefined' && window.innerWidth <= 768 ? 16 : 48} />
        <div className={styles.heroMesh} />
        <div className={styles.orb} />
        <div className={styles.orbSecondary} />
        <div className={styles.grid} />

        <div className={styles.heroInner}>
          {/* LEFT */}
          <div className={styles.heroLeft}>
            <motion.div className={styles.heroTag}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <span className={styles.heroTagIcon}>▲</span>
              Now Hiring · AI Specialists
            </motion.div>

            <div style={{ overflow: 'hidden' }}>
              <motion.h1 className={styles.heroTitle}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0, 0, 1] }}>
                <span className={styles.l1}>
                  {display[0]}
                  {curLine === 0 && <span className="tw-cursor">|</span>}
                </span>
                <span className={styles.l2} style={{ opacity: phraseVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                  <span className={styles.heroArrow}>›</span>
                  <em>{CYCLE_PHRASES[phraseIdx]}</em>
                </span>
              </motion.h1>
            </div>

            <motion.p className={styles.heroSub}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}>
              We find and hire the people who make AI systems better. Remote work, flexible hours, weekly pay. Roles open right now.
            </motion.p>

            <motion.div className={styles.heroBtns}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}>
              <button data-magnetic className="btn-primary" onClick={() => onNavigate('jobs')}>View Open Roles →</button>
              <div className={styles.heroChip}>
                <span className={styles.chipLive} />
                <span className={styles.chipText}>$20–$25<span className={styles.chipMuted}>/hr</span></span>
                <span className={styles.chipSep}>·</span>
                <span className={styles.chipText}>100% Remote</span>
                <span className={styles.chipSep}>·</span>
                <span className={styles.chipText}>Vetted Talent</span>
              </div>
            </motion.div>

            <motion.div className={styles.heroSubLink}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}>
              <button className={styles.heroTextLink} onClick={() => onNavigate('about')}>
                Or read our story →
              </button>
            </motion.div>

            <motion.div className={styles.heroStats}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}>
              {[
                { n: 5,    suffix: '',  label: 'Open Roles' },
                { n: 40,   suffix: '+', label: 'Countries' },
                { n: 1000, suffix: '+', label: 'Contributors' },
              ].map(({ n, suffix, label }) => (
                <div key={label} className={styles.statItem}>
                  <span className={styles.statNum}><Counter target={n} suffix={suffix} /></span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

        </div>

        <motion.div className={styles.scrollHint}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}>
          <div className={styles.scrollLine} />
          <span className={styles.scrollTxt}>Scroll</span>
        </motion.div>
      </section>

      {/* ── NUMBERS STRIP ── */}
      <div className={styles.numbersStrip}>
        <div className={styles.numbersTrack}>
          {[
            '$20–$25/hr', '100% Remote', '40+ Countries', '1,000+ Contributors',
            'Weekly Pay', 'Real Reviews', 'No Automated Rejections', 'Vetted Talent',
            '$20–$25/hr', '100% Remote', '40+ Countries', '1,000+ Contributors',
            'Weekly Pay', 'Real Reviews', 'No Automated Rejections', 'Vetted Talent',
          ].map((item, i) => (
            <span key={i} className={styles.numbersItem}>
              <span className={styles.numbersDot} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── SPONSORS MARQUEE ── */}
      <section className={styles.sponsors}>
        <div className={styles.sponsorsLabel}>Professionals from leading AI companies apply through Arcvoy</div>
        <div className={styles.marqueeWrap}>
          <div className={styles.marqueeTrack}>
            {[
              'Anthropic','DeepMind','Mistral AI','Hugging Face','Cohere',
              'Stability AI','Runway ML','Scale AI','Together AI','Weights & Biases',
              'Anthropic','DeepMind','Mistral AI','Hugging Face','Cohere',
              'Stability AI','Runway ML','Scale AI','Together AI','Weights & Biases',
            ].map((name, i) => (
              <span key={i} className={styles.sponsorName}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS + FEATURES ── */}
      <section className={styles.mergedSection}>
        <motion.div className={styles.mergedLeft}
          initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.25,0,0,1] }}>
          <div className="label">The Process</div>
          <h2 className={styles.secH}>
            From application to <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>day one</em>
          </h2>
          <div className={styles.howList}>
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} className={styles.howItem}
                initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease: [0.25,0,0,1], delay: i * 0.1 }}>
                <span className={styles.howBigNum}>{step.step}</span>
                <div className={styles.howContent}>
                  <div className={styles.howTitle}>{step.title}</div>
                  <p className={styles.howText}>{step.text}</p>
                </div>
                <div className={styles.howIconBadge}>{howIcons[step.icon]}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.mergedRight}
          initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.25,0,0,1], delay: 0.1 }}>
          <div className="label">Why Arcvoy</div>
          <h2 className={styles.secH}>
            Built for the <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>async era</em>
          </h2>
          <div className={styles.featStack}>
            {FEATURES.map((f, i) => (
              <TiltCard key={f.title} className={styles.featCard}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease: [0.25,0,0,1], delay: i * 0.1 }}>
                <span className={styles.featIcon}>{icons[f.icon]}</span>
                <div className={styles.featTitle}>{f.title}</div>
                <p className={styles.featText}>{f.text}</p>
              </TiltCard>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.testimonialsSection}>
        <motion.div className={styles.testimonialsHead}
          initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.25,0,0,1] }}>
          <div className="label" style={{ justifyContent: 'center' }}>Contributors Say</div>
          <h2 className={styles.secH} style={{ textAlign: 'center' }}>
            Real people, <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>real results</em>
          </h2>
        </motion.div>

        <div
          className={styles.quoteStage}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (Math.abs(dx) > 50) setActiveT(i => dx < 0 ? (i + 1) % TESTIMONIALS.length : (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
          }}
        >
          <motion.div
            key={activeT}
            className={styles.quoteWrap}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25,0,0,1] }}
          >
            <span className={styles.quoteMark}>"</span>
            <p className={styles.quoteText}>{TESTIMONIALS[activeT].quote}</p>
            <div className={styles.quoteAuthor}>
              <div className={styles.testimonialAvatar}>
                {TESTIMONIALS[activeT].photo
                  ? <img src={TESTIMONIALS[activeT].photo} alt={TESTIMONIALS[activeT].name} className={styles.testimonialPhoto} />
                  : TESTIMONIALS[activeT].initials}
              </div>
              <div>
                <div className={styles.testimonialName}>{TESTIMONIALS[activeT].name}</div>
                <div className={styles.testimonialRole}>{TESTIMONIALS[activeT].role} · {TESTIMONIALS[activeT].location}</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className={styles.carouselDots}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} className={`${styles.dot} ${i === activeT ? styles.dotActive : ''}`} onClick={() => setActiveT(i)} />
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaOrb} />
        <motion.div className={styles.ctaInner}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="label" style={{ justifyContent: 'center', marginBottom: 24 }}>Join the Network</div>
          <h2 className={styles.ctaTitle}>
            Ready to shape the <em>future of AI?</em>
          </h2>
          <p className={styles.ctaDesc}>
            Take a look at what is open. Every application gets a real review and a real response — good news or not.
          </p>
          <div className={styles.ctaBtns}>
            <button data-magnetic className="btn-primary" onClick={() => onNavigate('jobs')} style={{ padding: '15px 40px', fontSize: '11px' }}>
              Browse Open Roles →
            </button>
            <button data-magnetic className="btn-ghost" onClick={() => onNavigate('about')} style={{ padding: '15px 40px', fontSize: '11px' }}>
              Learn More
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── KEEP IN TOUCH ── */}
      <section className={styles.keepTouch} id="contact">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <div className="label" style={{ marginBottom: 16 }}>Stay Connected</div>
          <h2 className={styles.ktTitle}>Keep in <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>touch</em> with us</h2>
          <p className={styles.ktDesc}>New roles drop regularly. Get notified first and hear what is actually going on in the world of distributed AI work.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
          <div className={styles.newsletterBox}>
            <span className={styles.nlLabel}>Get notified</span>
            <p className={styles.nlDesc}>New openings, occasional updates. Nothing you did not ask for.</p>
            <div className={styles.nlRow}>
              <input className={styles.nlInput} type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} />
              <button className={styles.nlBtn} onClick={subscribe}>Subscribe →</button>
            </div>
            <p className={styles.nlNote}>No spam. Unsubscribe any time.</p>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div>
            <div className={styles.footerBrand}>
              <BrandMark size={15} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 22, fontWeight: 700 }}>Arcvoy</span>
            </div>
            <p className={styles.footerDesc}>We put the right people behind AI systems that actually work.</p>
            <div className={styles.footerSocials}>
              {socials.map(s => (
                <a key={s.label} className="soc-icon" href={s.url} title={s.label} target="_blank" rel="noopener noreferrer">{s.icon}</a>
              ))}
            </div>
          </div>
          <div className={styles.footerCol}>
            <h4>Company</h4>
            <button onClick={() => onNavigate('about')}>About Us</button>
            <button onClick={() => onNavigate('jobs')}>Careers</button>
            <button onClick={() => onNavigate('helpdesk')}>Contact</button>
          </div>
          <div className={styles.footerCol}>
            <h4>Support</h4>
            <button onClick={() => onNavigate('faq')}>FAQ</button>
            <button onClick={() => onNavigate('helpdesk')}>Help Desk</button>
            <button onClick={() => onNavigate('dashboard')}>My Dashboard</button>
          </div>
          <div className={styles.footerCol}>
            <h4>Legal</h4>
            <button onClick={() => onNavigate('privacy')}>Privacy Policy</button>
            <button onClick={() => onNavigate('terms')}>Terms of Use</button>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Arcvoy · Building the future of distributed work.</span>
          <div className={styles.footerLegal}>
            <button onClick={() => onNavigate('privacy')}>Privacy</button>
            <button onClick={() => onNavigate('terms')}>Terms</button>
          </div>
        </div>
      </footer>

      <div className={`toast ${toastVisible ? 'show' : ''}`}>Subscribed</div>
    </div>
  )
}
