import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import styles from './CandidateAuth.module.css'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

export default function CandidateAuth({ onClose, onSuccess }) {
  const [tab,      setTab]      = useState('login')   // 'login' | 'register'
  const [view,     setView]     = useState('auth')    // 'auth' | 'forgot' | 'forgot-sent'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)     // email verification sent

  const reset = () => { setError(''); setEmail(''); setPassword(''); setName('') }
  const switchTab = t => { setTab(t); setError('') }

  /* ── Email / password submit ── */
  const submit = async () => {
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onSuccess(data.user); onClose()
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name || email.split('@')[0] } },
        })
        if (error) throw error
        setSent(true)
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  /* ── Social OAuth ── */
  const socialLogin = async provider => {
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  /* ── Forgot password ── */
  const sendReset = async () => {
    if (!email) return setError('Please enter your email address.')
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) return setError(error.message)
    setView('forgot-sent')
  }

  const CloseBtn = () => (
    <button className="close-btn" onClick={onClose}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
      </svg>
    </button>
  )

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className={styles.box}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.28 }}>

        <AnimatePresence mode="wait">

          {/* ── Forgot-sent confirmation ── */}
          {view === 'forgot-sent' && (
            <motion.div key="forgot-sent" className={styles.sentWrap}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className={styles.head} style={{ justifyContent: 'flex-end', padding: '20px 20px 0' }}>
                <CloseBtn />
              </div>
              <div className={styles.sentIcon}>✉</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 400, color: 'var(--tx)', marginBottom: 8 }}>
                Check your inbox
              </h3>
              <p className={styles.sentText}>
                We sent a password reset link to <strong>{email}</strong>. Check your email and follow the link.
              </p>
              <button className={styles.switchLink} onClick={() => { setView('auth'); reset() }}>
                Back to Sign In
              </button>
            </motion.div>
          )}

          {/* ── Forgot password form ── */}
          {view === 'forgot' && (
            <motion.div key="forgot"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}>
              <div className={styles.head}>
                <div>
                  <div className={styles.brand}>✳ Arcvoy</div>
                  <div className={styles.title}>Reset your password</div>
                </div>
                <CloseBtn />
              </div>
              <div className={styles.body}>
                <p style={{ fontSize: 13, color: 'var(--tm)', lineHeight: 1.65, marginBottom: 4 }}>
                  Enter your email and we'll send you a link to create a new password.
                </p>
                <div className="fg">
                  <label className="fl">Email <span>*</span></label>
                  <input className="fi" type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && sendReset()}
                    placeholder="your@email.com" autoFocus />
                </div>
                {error && <div className={styles.err}>{error}</div>}
                <button className="sub-btn" onClick={sendReset} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending…</> : 'Send Reset Link →'}
                </button>
                <p className={styles.hint}>
                  <button className={styles.switchLink} onClick={() => { setView('auth'); setError('') }}>
                    ← Back to Sign In
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Email verification sent ── */}
          {view === 'auth' && sent && (
            <motion.div key="sent" className={styles.sentWrap}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className={styles.head} style={{ justifyContent: 'flex-end', padding: '20px 20px 0' }}>
                <CloseBtn />
              </div>
              <div className={styles.sentIcon}>✓</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 400, color: 'var(--tx)', marginBottom: 8 }}>
                Check your inbox
              </h3>
              <p className={styles.sentText}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
              </p>
              <button className={styles.switchLink} onClick={() => { setSent(false); switchTab('login') }}>
                Back to Sign In
              </button>
            </motion.div>
          )}

          {/* ── Main auth form ── */}
          {view === 'auth' && !sent && (
            <motion.div key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}>

              <div className={styles.head}>
                <div>
                  <div className={styles.brand}>✳ Arcvoy</div>
                  <div className={styles.title}>
                    {tab === 'login' ? 'Welcome back' : 'Create account'}
                  </div>
                </div>
                <CloseBtn />
              </div>

              {/* tabs */}
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${tab === 'login'    ? styles.tabActive : ''}`} onClick={() => switchTab('login')}>Sign In</button>
                <button className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`} onClick={() => switchTab('register')}>Register</button>
              </div>

              <div className={styles.body}>

                {/* social login */}
                <div className={styles.socialBtns}>
                  <button className={styles.socialBtn} onClick={() => socialLogin('google')}>
                    <GoogleIcon />
                    Continue with Google
                  </button>
                  <button className={styles.socialBtn} onClick={() => socialLogin('linkedin_oidc')}>
                    <LinkedInIcon />
                    Continue with LinkedIn
                  </button>
                </div>

                <div className={styles.divider}><span>or continue with email</span></div>

                {/* email fields */}
                {tab === 'register' && (
                  <div className="fg">
                    <label className="fl">Full Name</label>
                    <input className="fi" type="text" value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name" autoFocus />
                  </div>
                )}
                <div className="fg">
                  <label className="fl">Email</label>
                  <input className="fi" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="your@email.com" autoFocus={tab === 'login'} />
                </div>
                <div className="fg" style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <label className="fl" style={{ margin: 0 }}>Password</label>
                    {tab === 'login' && (
                      <button className={styles.forgotLink}
                        onClick={() => { setView('forgot'); setError('') }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input className="fi" type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="••••••••" />
                </div>

                {error && <div className={styles.err}>{error}</div>}

                <button className="sub-btn" onClick={submit} disabled={loading}
                  style={{ width: '100%', marginTop: 8 }}>
                  {loading
                    ? <><div className="spinner" /> {tab === 'login' ? 'Signing in…' : 'Creating account…'}</>
                    : tab === 'login' ? 'Sign In →' : 'Create Account →'}
                </button>

                <p className={styles.hint}>
                  {tab === 'login'
                    ? <>New here? <button className={styles.switchLink} onClick={() => switchTab('register')}>Create an account</button></>
                    : <>Already have one? <button className={styles.switchLink} onClick={() => switchTab('login')}>Sign in</button></>}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
