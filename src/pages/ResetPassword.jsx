import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import styles from './ResetPassword.module.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')
  const [done,     setDone]     = useState(false)
  const navigate = useNavigate()

  const submit = async () => {
    if (password.length < 8)   return setErr('Password must be at least 8 characters.')
    if (password !== confirm)  return setErr('Passwords do not match.')
    setLoading(true); setErr('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setErr(error.message)
    setDone(true)
    setTimeout(() => navigate('/'), 3000)
  }

  return (
    <div className={styles.page}>
      {/* ambient orb */}
      <div className={styles.orb} />

      <motion.div className={styles.card}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>

        {done ? (
          <>
            <div className={styles.successIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className={styles.title}>Password updated</h2>
            <p className={styles.sub}>You're all set. Redirecting you home in a moment…</p>
          </>
        ) : (
          <>
            <div className={styles.brandRow}>
              <span className={styles.brand}>✳ Arcvoy</span>
            </div>
            <h2 className={styles.title}>Set a new password</h2>
            <p className={styles.sub}>Choose something strong — at least 8 characters.</p>

            <div className={styles.form}>
              {err && <div className={styles.err}>{err}</div>}

              <div className="fg">
                <label className="fl">New Password <span>*</span></label>
                <input
                  className="fi" type="password"
                  value={password} onChange={e => { setPassword(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Min. 8 characters" autoFocus
                />
              </div>

              <div className="fg">
                <label className="fl">Confirm Password <span>*</span></label>
                <input
                  className="fi" type="password"
                  value={confirm} onChange={e => { setConfirm(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Repeat password"
                />
              </div>

              {/* strength indicator */}
              {password.length > 0 && (
                <div className={styles.strength}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`${styles.strengthBar} ${
                      password.length >= (i + 1) * 3 ? styles.strengthFill : ''
                    } ${password.length >= 12 ? styles.strengthStrong : ''}`} />
                  ))}
                  <span className={styles.strengthLabel}>
                    {password.length < 8 ? 'Too short' : password.length < 12 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}

              <button className="sub-btn" onClick={submit} disabled={loading}>
                {loading ? <><span className="spinner" /> Updating…</> : 'Update Password →'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
