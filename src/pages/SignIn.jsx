import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import styles from './SignIn.module.css'

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

export default function SignIn() {
  const navigate = useNavigate()
  const [view,     setView]     = useState('email')
  const [email,    setEmail]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate('/dashboard')
    })
    return () => clearInterval(timerRef.current)
  }, [navigate])

  const startCooldown = () => {
    setCooldown(60)
    timerRef.current = setInterval(() => {
      setCooldown(v => { if (v <= 1) { clearInterval(timerRef.current); return 0 } return v - 1 })
    }, 1000)
  }

  const sendOtp = async () => {
    if (!email) return setError('Please enter your email address.')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setView('otp')
    startCooldown()
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError('Please enter the 6-digit code.')
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) { setError('Invalid or expired code. Please try again.'); setLoading(false); return }
    if (data.user?.app_metadata?.role === 'admin') {
      await supabase.auth.signOut()
      setError('Please use the admin portal to sign in.')
      setLoading(false); return
    }
    navigate('/dashboard')
  }

  const socialLogin = async provider => {
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider, options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

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

  return (
    <div className={styles.page}>

      {/* ── Left brand panel ── */}
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <button className={styles.backLink} onClick={() => navigate('/')}>← Back to site</button>

          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <path d="M10 50 Q32 6 54 50" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
                <path d="M22 37 L42 37" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
                <circle cx="54" cy="50" r="3.5" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.wordmark}>Arcvoy</div>
            <div className={styles.brandDivider} />
            <p className={styles.tagline}>Track your AI career from first application to offer</p>
          </div>

          <div className={styles.features}>
            {[
              ['Track every application in real time', 'Stay on top of where each role stands as it moves through the pipeline.'],
              ['Receive status updates instantly',      'Get notified the moment your application status changes.'],
              ['One profile, every opportunity',        'Apply once and let your profile work across all open roles.'],
            ].map(([title, desc]) => (
              <div key={title} className={styles.feature}>
                <div className={styles.featureDot} />
                <div>
                  <div className={styles.featureTitle}>{title}</div>
                  <div className={styles.featureDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.right}>
        <div className={styles.rightInner}>
          <AnimatePresence mode="wait">

            {/* Reset link sent */}
            {view === 'forgot-sent' && (
              <motion.div key="forgot-sent" className={styles.formWrap}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className={styles.sentIcon}>✉</div>
                <h2 className={styles.formTitle}>Check your inbox</h2>
                <p className={styles.formSub}>We sent a reset link to <strong>{email}</strong>.</p>
                <button className={styles.switchLink} onClick={() => { setView('email'); setError('') }}>← Back to Sign In</button>
              </motion.div>
            )}

            {/* Forgot password */}
            {view === 'forgot' && (
              <motion.div key="forgot" className={styles.formWrap}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}>
                <h2 className={styles.formTitle}>Reset password</h2>
                <p className={styles.formSub}>Enter your email and we'll send you a reset link.</p>
                <div className={styles.fg}>
                  <label className={styles.label}>Email address</label>
                  <input className={styles.input} type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && sendReset()}
                    placeholder="you@email.com" autoFocus />
                </div>
                {error && <div className={styles.err}>{error}</div>}
                <button className={styles.submitBtn} onClick={sendReset} disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
                <button className={styles.switchLink} onClick={() => { setView('email'); setError('') }}>← Back</button>
              </motion.div>
            )}

            {/* OTP code entry */}
            {view === 'otp' && (
              <motion.div key="otp" className={styles.formWrap}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}>
                <div className={styles.otpIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 className={styles.formTitle}>Check your email</h2>
                <p className={styles.formSub}>We sent a 6-digit code to <strong>{email}</strong>. Expires in 10 minutes.</p>

                <div className={styles.spamNotice}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>Can't find it? Check your <strong>spam or junk folder</strong> — it sometimes lands there.</span>
                </div>

                <div className={styles.fg}>
                  <label className={styles.label}>Verification code</label>
                  <input
                    className={`${styles.input} ${styles.otpInput}`}
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={otp} placeholder="000000"
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                    autoFocus autoComplete="one-time-code" />
                </div>

                {error && <div className={styles.err}>{error}</div>}

                <button className={styles.submitBtn} onClick={verifyOtp} disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying…' : 'Verify & Continue →'}
                </button>

                <div className={styles.resendRow}>
                  <span>Didn't receive it?</span>
                  {cooldown > 0
                    ? <span className={styles.cooldownText}>Resend in {cooldown}s</span>
                    : <button className={styles.switchLink} onClick={sendOtp}>Resend code</button>}
                </div>
                <button className={styles.switchLink} onClick={() => { setView('email'); setOtp(''); setError('') }}>
                  ← Change email
                </button>
              </motion.div>
            )}

            {/* Email entry */}
            {view === 'email' && (
              <motion.div key="email" className={styles.formWrap}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}>

                <h2 className={styles.formTitle}>Welcome to Arcvoy</h2>
                <p className={styles.formSub}>Sign in or create an account to track your AI career</p>

                <div className={styles.socialBtns}>
                  <button className={styles.socialBtn} onClick={() => socialLogin('google')} disabled={loading}>
                    <GoogleIcon /> Continue with Google
                  </button>
                  <button className={styles.socialBtn} onClick={() => socialLogin('linkedin_oidc')} disabled={loading}>
                    <LinkedInIcon /> Continue with LinkedIn
                  </button>
                </div>

                <div className={styles.dividerRow}><span>or continue with email</span></div>

                <div className={styles.fg}>
                  <label className={styles.label}>Email address</label>
                  <input className={styles.input} type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="you@email.com" autoFocus />
                </div>

                {error && <div className={styles.err}>{error}</div>}

                <button className={styles.submitBtn} onClick={sendOtp} disabled={loading || !email}>
                  {loading ? 'Sending code…' : 'Send Code →'}
                </button>

                <p className={styles.hint}>
                  By continuing you agree to our{' '}
                  <button className={styles.switchLink} onClick={() => navigate('/terms')}>Terms</button>
                  {' '}and{' '}
                  <button className={styles.switchLink} onClick={() => navigate('/privacy')}>Privacy Policy</button>.
                </p>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
