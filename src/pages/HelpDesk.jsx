import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import CustomSelect from '../components/CustomSelect'
import styles from './HelpDesk.module.css'

const CATEGORIES = ['Application Issue', 'Payment / Billing', 'Technical Problem', 'Account Access', 'Role Inquiry', 'Other']
const MAX_CHARS   = 1000

/* ── email submit ── */
async function submitTicket({ name, email, category, subject, message }) {
  const { error } = await supabase.from('tickets').insert([{ name, email, category, subject, message, status: 'open' }])
  if (error) throw error

  await supabase.functions.invoke('send-email', {
    body: {
      from: 'Arcvoy Help Desk <noreply@arcvoy.com>',
      to: 'support@arcvoy.com',
      subject: `[${category}] ${subject}`,
      html: `
        <div style="font-family:Calibri,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;">
          <div style="background:#1A1410;padding:22px 32px;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 Q32 6 54 50" stroke="#cc6633" stroke-width="5" stroke-linecap="round"/><path d="M22 37 L42 37" stroke="#cc6633" stroke-width="5" stroke-linecap="round"/><circle cx="54" cy="50" r="3.5" fill="#cc6633"/></svg>
              <span style="font-family:Georgia,serif;font-size:20px;color:#F5F0EB;font-weight:400;">Arcvoy</span>
            </div>
            <span style="font-size:10px;color:#6a5a4a;letter-spacing:0.1em;text-transform:uppercase;">Support</span>
          </div>
          <div style="padding:38px 32px;background:#ffffff;">
            <p style="font-size:10px;color:#b0a090;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">New Support Ticket</p>
            <h2 style="font-size:14px;color:#1A1410;font-weight:700;margin:0 0 28px;letter-spacing:0.06em;text-transform:uppercase;">${subject}</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
              <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;width:42%;border-bottom:1px solid #F5F0EB;">From</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${name} &lt;${email}&gt;</td></tr>
              <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Category</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${category}</td></tr>
            </table>
            <p style="font-size:10px;color:#b0a090;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">Message</p>
            <div style="background:#FAF7F4;border-left:3px solid #cc6633;padding:18px 20px;font-size:14px;line-height:1.85;color:#3a2a1a;border-radius:0 4px 4px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="background:#F5F0EB;padding:16px 32px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;">
            <p style="margin:0;font-size:11px;color:#b0a090;">© 2026 Arcvoy</p>
            <p style="margin:0;font-size:11px;color:#b0a090;"><a href="https://arcvoy.com" style="color:#b0a090;text-decoration:none;">arcvoy.com</a> &nbsp;·&nbsp; <a href="https://x.com/helloarcvoy" style="color:#b0a090;text-decoration:none;">@helloarcvoy</a></p>
          </div>
        </div>`,
    },
  })
}

/* ── confetti burst ── */
function spawnConfetti(container) {
  if (!container) return
  const colors = ['#cc6633', '#e07a4a', '#f4c9a0', '#ffffff', '#cc6633', '#f0c04a']
  for (let i = 0; i < 64; i++) {
    const el = document.createElement('div')
    el.className = styles.confettiPiece
    const size = Math.random() * 8 + 4
    el.style.cssText = `
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      width:${size}px; height:${size}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation-delay:${Math.random() * 0.45}s;
      animation-duration:${Math.random() * 0.9 + 1}s;
      --tx:${(Math.random() - 0.5) * 120}px;
    `
    container.appendChild(el)
    setTimeout(() => el.remove(), 2200)
  }
}

/* ── field-level validator ── */
function validateField(k, val) {
  if (k === 'name')    return val.trim()                         ? '' : 'Required'
  if (k === 'email')   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Valid email required'
  if (k === 'subject') return val.trim()                         ? '' : 'Required'
  if (k === 'message') return val.trim()                         ? '' : 'Required'
  return ''
}

export default function HelpDesk() {
  const [form, setForm]       = useState({ name: '', email: '', category: '', subject: '', message: '' })
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [copied, setCopied]   = useState(false)
  const confettiRef           = useRef(null)

  /* set field value + clear its error */
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  /* blur: mark touched + validate */
  const onBlur = k => {
    setTouched(t => ({ ...t, [k]: true }))
    const err = validateField(k, form[k])
    if (err) setErrors(e => ({ ...e, [k]: err }))
  }

  /* full-form validate on submit */
  const validate = () => {
    const e = {}
    if (!form.name.trim())                              e.name     = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email  = 'Valid email required'
    if (!form.category)                                 e.category = 'Required'
    if (!form.subject.trim())                           e.subject  = 'Required'
    if (!form.message.trim())                           e.message  = 'Required'
    return e
  }

  /* progress: how many of the 5 required fields are filled (0-100 in 20-steps) */
  const progress = [
    !!form.name.trim(),
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    !!form.category,
    !!form.subject.trim(),
    !!form.message.trim(),
  ].filter(Boolean).length * 20

  /* clipboard copy */
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('support@arcvoy.com')
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch { /* ignore */ }
  }

  /* submit */
  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      setTouched({ name: true, email: true, category: true, subject: true, message: true })
      return
    }
    setLoading(true)
    try {
      await submitTicket(form)
      setDone(true)
      requestAnimationFrame(() => spawnConfetti(confettiRef.current))
    } catch {
      setErrors({ global: 'Something went wrong. Please try again.' })
    }
    setLoading(false)
  }

  /* reset after success */
  const reset = () => {
    setDone(false)
    setForm({ name: '', email: '', category: '', subject: '', message: '' })
    setErrors({})
    setTouched({})
  }

  /* char counter */
  const charsLeft = MAX_CHARS - form.message.length

  /* helper: field class */
  const fieldCls = k =>
    errors[k] ? 'fi-error' : touched[k] && !validateField(k, form[k]) ? styles.fieldOk : ''

  return (
    <div className={styles.page}>

      {/* ── hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div className="label" style={{ marginBottom: 14 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Support
          </motion.div>

          <motion.h1 className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            How can we <em>help?</em>
          </motion.h1>

          <motion.p className={styles.heroSub}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            Submit a ticket and our team will respond within 24 hours. For urgent matters, every ticket is reviewed the same day.
          </motion.p>

          <motion.div className={styles.chips}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>

            {/* clickable email chip — copies to clipboard */}
            <button className={styles.chip} onClick={copyEmail} title="Click to copy email address">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="ok"    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ color: '#4caf50' }}>Copied!</motion.span>
                  : <motion.span key="addr"  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>support@arcvoy.com</motion.span>
                }
              </AnimatePresence>
            </button>

            <span className={styles.chip}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Response within 24 hours
            </span>

          </motion.div>
        </div>
      </div>

      {/* ── body ── */}
      <div className={styles.body}>

        {/* form card */}
        <motion.div className={styles.formCard}
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>

          {/* ── completion progress bar ── */}
          <AnimatePresence>
            {!done && (
              <div className={styles.progressTrack}>
                <motion.div
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: [0.25, 0, 0, 1] }}
                />
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ── SUCCESS STATE ── */}
            {done ? (
              <motion.div key="done" className={styles.successView} ref={confettiRef}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                <motion.div className={styles.successIcon}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </motion.div>
                <h3 className={styles.successTitle}>Ticket submitted</h3>
                <p className={styles.successText}>
                  We received your message and will reply to <strong>{form.email}</strong> within 24 hours.
                </p>
                <button className="btn-ghost" onClick={reset}>Submit another ticket</button>
              </motion.div>

            ) : (

              /* ── FORM ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>

                <div className={styles.formHead}>
                  <div className={styles.formHeadLeft}>
                    <h2 className={styles.formTitle}>Submit a Ticket</h2>
                    <p className={styles.formSub}>Fill in the details below and we will get back to you.</p>
                  </div>
                  {progress > 0 && (
                    <div className={styles.progressLabel} title="Form completion">
                      {progress}%
                    </div>
                  )}
                </div>

                <div className={styles.formBody}>

                  {/* name + email */}
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className="fl">Your Name <span>*</span></label>
                      <input
                        className={`fi ${fieldCls('name')}`}
                        type="text" placeholder="Full name"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        onBlur={() => onBlur('name')}
                      />
                      <AnimatePresence>
                        {errors.name && (
                          <motion.p className={styles.fieldErr}
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {errors.name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className={styles.field}>
                      <label className="fl">Email Address <span>*</span></label>
                      <input
                        className={`fi ${fieldCls('email')}`}
                        type="email" placeholder="your@email.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        onBlur={() => onBlur('email')}
                      />
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p className={styles.fieldErr}
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {errors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* category */}
                  <div className={styles.field}>
                    <label className="fl">Category <span style={{ color: 'var(--gd)' }}>*</span></label>
                    <CustomSelect
                      value={form.category}
                      onChange={v => set('category', v)}
                      options={CATEGORIES}
                      placeholder="Select a category"
                      error={!!errors.category}
                    />
                  </div>

                  {/* subject */}
                  <div className={styles.field}>
                    <label className="fl">Subject <span>*</span></label>
                    <input
                      className={`fi ${fieldCls('subject')}`}
                      type="text" placeholder="Brief description of your issue"
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      onBlur={() => onBlur('subject')}
                    />
                    <AnimatePresence>
                      {errors.subject && (
                        <motion.p className={styles.fieldErr}
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {errors.subject}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* message + char counter */}
                  <div className={styles.field}>
                    <div className={styles.msgLabelRow}>
                      <label className="fl" style={{ marginBottom: 0 }}>Message <span>*</span></label>
                      <span className={`${styles.charCount} ${charsLeft < 100 ? styles.charWarn : ''} ${charsLeft < 0 ? styles.charOver : ''}`}>
                        {Math.max(0, charsLeft)}&thinsp;/&thinsp;{MAX_CHARS}
                      </span>
                    </div>
                    <textarea
                      className={`ft ${fieldCls('message')}`}
                      rows={6}
                      placeholder="Describe your issue in as much detail as possible."
                      value={form.message}
                      onChange={e => { if (e.target.value.length <= MAX_CHARS) set('message', e.target.value) }}
                      onBlur={() => onBlur('message')}
                    />
                    <AnimatePresence>
                      {errors.message && (
                        <motion.p className={styles.fieldErr}
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {errors.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* global error */}
                  <AnimatePresence>
                    {errors.global && (
                      <motion.p className={styles.fieldErr}
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {errors.global}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button className="sub-btn" onClick={submit} disabled={loading || charsLeft < 0}>
                    {loading
                      ? <><div className="spinner" /> Sending…</>
                      : 'Send Ticket →'}
                  </button>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── side info ── */}
        <motion.div className={styles.sideInfo}
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h4 className={styles.infoTitle}>Response Times</h4>
            <ul className={styles.infoList}>
              <li><span>General enquiry</span><strong>24 hrs</strong></li>
              <li><span>Billing issue</span><strong>12 hrs</strong></li>
              <li><span>Urgent matter</span><strong>4 hrs</strong></li>
            </ul>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h4 className={styles.infoTitle}>Before You Submit</h4>
            <p className={styles.infoText}>
              Visit our FAQ page first. Most common questions are answered there and you will get an instant answer.
            </p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h4 className={styles.infoTitle}>Direct Contact</h4>
            <p className={styles.infoText}>support@arcvoy.com</p>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
