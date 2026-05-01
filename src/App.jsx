import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import CursorGlow from './components/CursorGlow'
import { useTheme } from './hooks/useTheme'
import { supabase } from './lib/supabase'
import { useSEO } from './hooks/useSEO'

const Home          = lazy(() => import('./pages/Home'))
const Jobs          = lazy(() => import('./pages/Jobs'))
const About         = lazy(() => import('./pages/About'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const FAQ           = lazy(() => import('./pages/FAQ'))
const HelpDesk      = lazy(() => import('./pages/HelpDesk'))
const NotFound      = lazy(() => import('./pages/NotFound'))
const JobDetail     = lazy(() => import('./pages/JobDetail'))
const Apply         = lazy(() => import('./pages/Apply'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Terms         = lazy(() => import('./pages/Terms'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const CandidateAuth  = lazy(() => import('./components/CandidateAuth'))

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

const SEO_MAP = {
  '/':               { title: null,             description: "Arcvoy connects AI professionals with the world's leading AI-first companies. Discover remote AI jobs and build the future." },
  '/jobs':           { title: 'Careers',        description: 'Browse open AI roles at Arcvoy. Remote-first positions across AI research, engineering, evaluation, and support.' },
  '/about':          { title: 'About',           description: "Learn about Arcvoy's mission to connect exceptional AI talent with the companies building the future of technology." },
  '/dashboard':      { title: 'My Dashboard',   description: 'Track your Arcvoy job applications, view status updates, and manage your profile.' },
  '/faq':            { title: 'FAQ',             description: 'Frequently asked questions about applying to Arcvoy, the hiring process, pay, and remote work policies.' },
  '/helpdesk':       { title: 'Help Desk',       description: "Get in touch with the Arcvoy team. Submit a support request and we'll get back to you within 24 hours." },
  '/reset-password': { title: 'Reset Password', description: null },
  '/privacy':        { title: 'Privacy Policy', description: "Read Arcvoy's privacy policy and learn how we collect, use, and protect your personal data." },
  '/terms':          { title: 'Terms of Use',   description: "Review Arcvoy's terms of use governing access to the platform and submission of applications." },
}

export default function App() {
  const { theme, toggle }             = useTheme()
  const [showCandAuth, setShowCandAuth] = useState(false)
  const [candidateUser, setCandidateUser] = useState(null)
  const [pendingJob, setPendingJob]   = useState(null)
  const navigate  = useNavigate()
  const location  = useLocation()

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
  }, [navigate])


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
    else if (page === 'privacy')   navigate('/privacy')
    else if (page === 'terms')     navigate('/terms')
  }

  const currentPage = location.pathname === '/jobs'           ? 'jobs'
    : location.pathname === '/about'          ? 'about'
    : location.pathname === '/dashboard'      ? 'dashboard'
    : location.pathname === '/faq'            ? 'faq'
    : location.pathname === '/helpdesk'       ? 'helpdesk'
    : location.pathname === '/privacy'        ? 'privacy'
    : location.pathname === '/terms'          ? 'terms'
    : location.pathname.startsWith('/jobs/')  ? 'jobs'
    : 'home'

  const isJobDetail = location.pathname.startsWith('/jobs/')
  const seo = isJobDetail ? {} : (SEO_MAP[location.pathname] ?? { title: null, description: null })

  useSEO(seo)

  const isAdmin = location.pathname === '/admin'

  return (
    <>
      {!isAdmin && <CursorGlow />}
      {!isAdmin && <ScrollProgress />}

      {!isAdmin && (
        <Navbar
          theme={theme}
          onToggleTheme={toggle}
          onShowLogin={() => navigate('/admin')}
          onShowCandidateAuth={() => setShowCandAuth(true)}
          page={currentPage}
          onNavigate={onNavigate}
          user={candidateUser}
        />
      )}

      <Suspense fallback={null}>
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
              <Jobs initialJob={pendingJob} onClearInitial={() => setPendingJob(null)} user={candidateUser} />
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
              <JobDetail user={candidateUser} />
            </motion.div>
          } />
          <Route path="/jobs/:id/apply" element={
            <motion.div key="apply" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Apply user={candidateUser} />
            </motion.div>
          } />
          <Route path="/reset-password" element={
            <motion.div key="reset-password" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ResetPassword />
            </motion.div>
          } />
          <Route path="/privacy" element={
            <motion.div key="privacy" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <PrivacyPolicy />
            </motion.div>
          } />
          <Route path="/terms" element={
            <motion.div key="terms" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Terms />
            </motion.div>
          } />
          <Route path="/admin" element={
            <AdminDashboard />
          } />
          <Route path="*" element={
            <motion.div key="404" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <NotFound />
            </motion.div>
          } />
        </Routes>
      </AnimatePresence>
      </Suspense>

      {/* Candidate auth modal */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showCandAuth && (
            <CandidateAuth
              key="cand-auth"
              onClose={() => setShowCandAuth(false)}
              onSuccess={user => { setCandidateUser(user); setShowCandAuth(false); navigate('/dashboard') }}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </>
  )
}
