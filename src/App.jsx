import { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import FAQ from './pages/FAQ'
import HelpDesk from './pages/HelpDesk'
import NotFound from './pages/NotFound'
import AdminDashboard from './components/AdminDashboard'
import CandidateAuth from './components/CandidateAuth'
import JobDetail from './pages/JobDetail'
import ResetPassword from './pages/ResetPassword'
import { useTheme } from './hooks/useTheme'
import { supabase } from './lib/supabase'

/* ── Scroll progress bar ── */
function ScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const fn = () => {
      const total = document.body.scrollHeight - window.innerHeight
      setPct(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, height: '2px',
      width: pct + '%', background: 'var(--gd)', zIndex: 9999,
      transition: 'width 0.1s linear', pointerEvents: 'none',
    }} />
  )
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.25, 0, 0, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.25 } },
}

export default function App() {
  const { theme, toggle }             = useTheme()
  const [showAdmin, setShowAdmin]     = useState(false)
  const [showCandAuth, setShowCandAuth] = useState(false)
  const [candidateUser, setCandidateUser] = useState(null)
  const [pendingJob, setPendingJob]   = useState(null)
  const navigate  = useNavigate()
  const location  = useLocation()
  const dotRef    = useRef(null)
  const ringRef   = useRef(null)
  const posRef    = useRef({ mx: 0, my: 0, rx: 0, ry: 0 })

  /* restore candidate session on load */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setCandidateUser(data.session.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setCandidateUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  /* custom cursor */
  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    const onMove = e => {
      posRef.current.mx = e.clientX; posRef.current.my = e.clientY
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'
    }
    let raf
    const lerp = () => {
      const p = posRef.current
      p.rx += (p.mx - p.rx) * 0.10; p.ry += (p.my - p.ry) * 0.10
      ring.style.left = p.rx + 'px'; ring.style.top = p.ry + 'px'
      raf = requestAnimationFrame(lerp)
    }
    const onEnter = () => { ring.classList.add('hovering'); dot.classList.add('hovering') }
    const onLeave = () => { ring.classList.remove('hovering'); dot.classList.remove('hovering') }
    const addListeners = () => {
      document.querySelectorAll('button, a, input, select, .job-card').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    document.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(lerp)
    addListeners()
    const obs = new MutationObserver(addListeners)
    obs.observe(document.body, { childList: true, subtree: true })
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); obs.disconnect() }
  }, [])

  /* ── ripple effect on button clicks ── */
  useEffect(() => {
    const handler = e => {
      const btn = e.target.closest('.btn-primary, .sub-btn, .btn-ghost')
      if (!btn) return
      const r = btn.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'ripple-wave'
      ripple.style.left = (e.clientX - r.left) + 'px'
      ripple.style.top  = (e.clientY - r.top)  + 'px'
      btn.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  /* ── magnetic effect on [data-magnetic] elements ── */
  useEffect(() => {
    const PULL = 0.38
    const onMove = e => {
      document.querySelectorAll('[data-magnetic]').forEach(el => {
        const r    = el.getBoundingClientRect()
        const cx   = r.left + r.width  / 2
        const cy   = r.top  + r.height / 2
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
        const zone = Math.max(r.width, r.height) * 1.4
        if (dist < zone) {
          const dx = (e.clientX - cx) * PULL
          const dy = (e.clientY - cy) * PULL
          el.style.transform  = `translate(${dx}px, ${dy}px)`
          el.style.transition = 'transform 0.15s ease'
        } else {
          el.style.transform  = 'translate(0,0)'
          el.style.transition = 'transform 0.5s cubic-bezier(0.25,0,0,1)'
        }
      })
    }
    document.addEventListener('mousemove', onMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') {
        setShowAdmin(false)
        setShowCandAuth(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const onNavigate = page => {
    if (page === 'home')           navigate('/')
    else if (page === 'jobs')      navigate('/jobs')
    else if (page === 'about')     navigate('/about')
    else if (page === 'dashboard') navigate('/dashboard')
    else if (page === 'faq')       navigate('/faq')
    else if (page === 'helpdesk')  navigate('/helpdesk')
  }

  const currentPage = location.pathname === '/jobs'      ? 'jobs'
    : location.pathname === '/about'     ? 'about'
    : location.pathname === '/dashboard' ? 'dashboard'
    : location.pathname === '/faq'       ? 'faq'
    : location.pathname === '/helpdesk'  ? 'helpdesk'
    : 'home'

  useEffect(() => {
    const titles = {
      '/':                'Arcvoy — Build the Future',
      '/jobs':            'Careers — Arcvoy',
      '/about':           'About — Arcvoy',
      '/dashboard':       'My Dashboard — Arcvoy',
      '/faq':             'FAQ — Arcvoy',
      '/helpdesk':        'Help Desk — Arcvoy',
      '/reset-password':  'Reset Password — Arcvoy',
    }
    document.title = titles[location.pathname] ?? 'Arcvoy'
  }, [location.pathname])

  return (
    <>
      <ScrollProgress />
      <div className="cursor-dot"  ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />

      <Navbar
        theme={theme}
        onToggleTheme={toggle}
        onShowLogin={() => setShowAdmin(true)}
        onShowCandidateAuth={() => setShowCandAuth(true)}
        page={currentPage}
        onNavigate={onNavigate}
        user={candidateUser}
      />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Home
                onNavigate={onNavigate}
                onApply={job => { setPendingJob(job); navigate('/jobs') }}
              />
            </motion.div>
          } />
          <Route path="/jobs" element={
            <motion.div key="jobs" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Jobs initialJob={pendingJob} onClearInitial={() => setPendingJob(null)} />
            </motion.div>
          } />
          <Route path="/about" element={
            <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <About onNavigate={onNavigate} />
            </motion.div>
          } />
          <Route path="/dashboard" element={
            <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Dashboard user={candidateUser} onNavigate={onNavigate} />
            </motion.div>
          } />
          <Route path="/faq" element={
            <motion.div key="faq" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <FAQ onNavigate={onNavigate} />
            </motion.div>
          } />
          <Route path="/helpdesk" element={
            <motion.div key="helpdesk" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HelpDesk />
            </motion.div>
          } />
          <Route path="/jobs/:id" element={
            <motion.div key="job-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <JobDetail />
            </motion.div>
          } />
          <Route path="/reset-password" element={
            <motion.div key="reset-password" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ResetPassword />
            </motion.div>
          } />
          <Route path="*" element={
            <motion.div key="404" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <NotFound />
            </motion.div>
          } />
        </Routes>
      </AnimatePresence>

      {/* Admin dashboard */}
      <AnimatePresence>
        {showAdmin && <AdminDashboard key="admin" onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>

      {/* Candidate auth modal */}
      <AnimatePresence>
        {showCandAuth && (
          <CandidateAuth
            key="cand-auth"
            onClose={() => setShowCandAuth(false)}
            onSuccess={user => { setCandidateUser(user); setShowCandAuth(false); navigate('/dashboard') }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
