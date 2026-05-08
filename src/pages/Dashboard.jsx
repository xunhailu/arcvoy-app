import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { getW9, saveW9, getPaymentInfo, savePaymentInfo } from '../lib/contractor'
import styles from './Dashboard.module.css'

const PIPELINE = ['applied', 'reviewing', 'interviewed', 'offered', 'hired']
const STAGE_LABELS = { applied: 'Applied', reviewing: 'Reviewing', interviewed: 'Interviewed', offered: 'Offered', hired: 'Hired' }

const TAX_CLASSES = [
  'Individual / Sole Proprietor',
  'Single-member LLC',
  'C Corporation',
  'S Corporation',
  'Partnership',
  'Trust / Estate',
]

function getStepState(stage, currentStatus) {
  if (currentStatus === 'rejected') return stage === 'applied' ? 'done' : 'inactive'
  const ci = PIPELINE.indexOf(currentStatus)
  const si = PIPELINE.indexOf(stage)
  if (si < ci)  return 'done'
  if (si === ci) return 'current'
  return 'upcoming'
}

function Timeline({ status }) {
  const isRejected = status === 'rejected'
  return (
    <div className={styles.timeline}>
      {PIPELINE.map((stage, idx) => {
        const state     = getStepState(stage, status)
        const nextState = idx < PIPELINE.length - 1 ? getStepState(PIPELINE[idx + 1], status) : null
        return (
          <div key={stage} className={styles.timelineStep}>
            <div className={`${styles.stepDot} ${styles['stepDot_' + state]} ${isRejected && stage === 'applied' ? styles.stepDotRejected : ''}`}>
              {state === 'done' && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {state === 'current' && !isRejected && <div className={styles.stepPulse} />}
            </div>
            <span className={`${styles.stepLabel} ${styles['stepLabel_' + state]}`}>{STAGE_LABELS[stage]}</span>
            {idx < PIPELINE.length - 1 && (
              <div className={`${styles.stepLine} ${(nextState === 'done' || nextState === 'current') ? styles.stepLineFilled : ''}`} />
            )}
          </div>
        )
      })}
      {isRejected && <div className={styles.rejectedBadge}>Rejected</div>}
    </div>
  )
}

/* ── W-9 Form ── */
function W9Tab({ user, apps }) {
  const isHired = apps.some(a => a.status === 'hired')
  const [w9,      setW9]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    legal_name: user?.user_metadata?.full_name || '',
    business_name: '',
    tax_classification: 'Individual / Sole Proprietor',
    address: '', city: '', state: '', zip: '',
    tin_type: 'ssn', tin: '',
    certified: false,
  })

  useEffect(() => {
    if (!user) return
    getW9(user.id).then(data => {
      if (data) setW9(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleTin = v => {
    const digits = v.replace(/\D/g, '').slice(0, 9)
    if (form.tin_type === 'ssn') {
      const formatted = digits.length > 5 ? `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`
        : digits.length > 3 ? `${digits.slice(0,3)}-${digits.slice(3)}`
        : digits
      set('tin', formatted)
    } else {
      const formatted = digits.length > 2 ? `${digits.slice(0,2)}-${digits.slice(2)}` : digits
      set('tin', formatted)
    }
  }

  const submit = async () => {
    const required = ['legal_name','address','city','state','zip','tin']
    if (required.some(k => !form[k])) return toast.error('Please fill in all required fields.')
    if (!form.certified) return toast.error('Please check the certification box.')
    const tinDigits = form.tin.replace(/\D/g, '')
    if (tinDigits.length !== 9) return toast.error('Please enter a valid 9-digit TIN.')
    setSaving(true)
    try {
      const saved = await saveW9(user.id, user.email, {
        ...form, tin: form.tin,
      })
      setW9(saved)
      toast.success('W-9 submitted successfully.')
    } catch { toast.error('Could not save W-9. Please try again.') }
    setSaving(false)
  }

  if (loading) return <div className={styles.tabLoading}>Loading…</div>

  if (!isHired) return (
    <div className={styles.lockedBox}>
      <div className={styles.lockedIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div className={styles.lockedTitle}>Tax Documents Locked</div>
      <div className={styles.lockedDesc}>Your W-9 form will be available once you have been hired for a role. Keep track of your applications below.</div>
    </div>
  )

  if (w9) return (
    <div className={styles.submittedBox}>
      <div className={styles.submittedIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div className={styles.submittedTitle}>W-9 Submitted</div>
      <div className={styles.submittedDesc}>Filed on {new Date(w9.certified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div className={styles.w9Summary}>
        <div className={styles.w9SummaryRow}><span>Legal Name</span><strong>{w9.legal_name}</strong></div>
        {w9.business_name && <div className={styles.w9SummaryRow}><span>Business Name</span><strong>{w9.business_name}</strong></div>}
        <div className={styles.w9SummaryRow}><span>Classification</span><strong>{w9.tax_classification}</strong></div>
        <div className={styles.w9SummaryRow}><span>Address</span><strong>{w9.address}, {w9.city}, {w9.state} {w9.zip}</strong></div>
        <div className={styles.w9SummaryRow}><span>{w9.tin_type === 'ssn' ? 'SSN' : 'EIN'}</span><strong>***-**-{w9.tin.replace(/\D/g,'').slice(-4)}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--td)', marginTop: 16, fontFamily: "'Raleway',sans-serif" }}>
        To update your W-9, please contact <a href="mailto:support@arcvoy.com" style={{ color: 'var(--gd)' }}>support@arcvoy.com</a>.
      </p>
    </div>
  )

  return (
    <div className={styles.formCard}>
      <div className={styles.formCardHead}>
        <div className={styles.formCardTitle}>W-9 — Request for Taxpayer Identification</div>
        <div className={styles.formCardSub}>Required before your first payment. All fields marked * are mandatory.</div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fg2}>
          <label className={styles.fl2}>Legal Name *</label>
          <input className={styles.fi2} value={form.legal_name} placeholder="Your full legal name"
            onChange={e => set('legal_name', e.target.value)} />
        </div>
        <div className={styles.fg2}>
          <label className={styles.fl2}>Business Name <span className={styles.optional}>(optional)</span></label>
          <input className={styles.fi2} value={form.business_name} placeholder="DBA or company name if applicable"
            onChange={e => set('business_name', e.target.value)} />
        </div>
        <div className={`${styles.fg2} ${styles.colSpan2}`}>
          <label className={styles.fl2}>Tax Classification *</label>
          <select className={styles.fi2} value={form.tax_classification}
            onChange={e => set('tax_classification', e.target.value)}>
            {TAX_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={`${styles.fg2} ${styles.colSpan2}`}>
          <label className={styles.fl2}>Street Address *</label>
          <input className={styles.fi2} value={form.address} placeholder="123 Main St"
            onChange={e => set('address', e.target.value)} />
        </div>
        <div className={styles.fg2}>
          <label className={styles.fl2}>City *</label>
          <input className={styles.fi2} value={form.city} placeholder="City"
            onChange={e => set('city', e.target.value)} />
        </div>
        <div className={styles.fg2}>
          <label className={styles.fl2}>State *</label>
          <input className={styles.fi2} value={form.state} placeholder="e.g. CA"
            onChange={e => set('state', e.target.value)} />
        </div>
        <div className={styles.fg2}>
          <label className={styles.fl2}>ZIP Code *</label>
          <input className={styles.fi2} value={form.zip} placeholder="e.g. 90210"
            onChange={e => set('zip', e.target.value)} />
        </div>
        <div className={styles.fg2}>
          <label className={styles.fl2}>TIN Type *</label>
          <select className={styles.fi2} value={form.tin_type}
            onChange={e => { set('tin_type', e.target.value); set('tin', '') }}>
            <option value="ssn">Social Security Number (SSN)</option>
            <option value="ein">Employer ID Number (EIN)</option>
          </select>
        </div>
        <div className={`${styles.fg2} ${styles.colSpan2}`}>
          <label className={styles.fl2}>{form.tin_type === 'ssn' ? 'SSN (XXX-XX-XXXX)' : 'EIN (XX-XXXXXXX)'} *</label>
          <input className={styles.fi2} value={form.tin}
            placeholder={form.tin_type === 'ssn' ? '000-00-0000' : '00-0000000'}
            onChange={e => handleTin(e.target.value)}
            type="text" inputMode="numeric" />
        </div>
      </div>

      <div className={styles.certifyRow}>
        <input type="checkbox" id="certify" checked={form.certified}
          onChange={e => set('certified', e.target.checked)} className={styles.certifyCheck} />
        <label htmlFor="certify" className={styles.certifyLabel}>
          Under penalty of perjury, I certify that the information provided on this form is true, correct, and complete, and that I am a U.S. person (including a U.S. resident alien).
        </label>
      </div>

      <button className={styles.submitFormBtn} onClick={submit} disabled={saving}>
        {saving ? 'Submitting…' : 'Submit W-9 →'}
      </button>
    </div>
  )
}

/* ── Payment Info Tab ── */
function PaymentTab({ user, w9 }) {
  const [info,    setInfo]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    method: 'bank',
    account_name: '', bank_name: '', account_number: '', routing_number: '',
    paypal_email: '', wise_email: '',
  })

  useEffect(() => {
    if (!user) return
    getPaymentInfo(user.id).then(data => {
      if (data) { setInfo(data); setForm(data) }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (form.method === 'bank') {
      if (!form.account_name || !form.bank_name || !form.account_number || !form.routing_number)
        return toast.error('Please fill in all bank details.')
    } else if (form.method === 'paypal' && !form.paypal_email) {
      return toast.error('Please enter your PayPal email.')
    } else if (form.method === 'wise' && !form.wise_email) {
      return toast.error('Please enter your Wise email.')
    }
    setSaving(true)
    try {
      const saved = await savePaymentInfo(user.id, user.email, form)
      setInfo(saved); setEditing(false)
      toast.success('Payment info saved.')
    } catch { toast.error('Could not save payment info. Please try again.') }
    setSaving(false)
  }

  if (loading) return <div className={styles.tabLoading}>Loading…</div>

  if (!w9) return (
    <div className={styles.lockedBox}>
      <div className={styles.lockedIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div className={styles.lockedTitle}>Complete W-9 First</div>
      <div className={styles.lockedDesc}>Submit your W-9 tax form before adding payment details. Switch to the W-9 tab to get started.</div>
    </div>
  )

  if (info && !editing) return (
    <div className={styles.submittedBox}>
      <div className={styles.submittedIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div className={styles.submittedTitle}>Payment Info Saved</div>
      <div className={styles.w9Summary}>
        <div className={styles.w9SummaryRow}><span>Method</span><strong style={{ textTransform: 'capitalize' }}>{info.method === 'bank' ? 'Bank Transfer (ACH)' : info.method === 'paypal' ? 'PayPal' : 'Wise'}</strong></div>
        {info.method === 'bank' && <>
          <div className={styles.w9SummaryRow}><span>Account Name</span><strong>{info.account_name}</strong></div>
          <div className={styles.w9SummaryRow}><span>Bank</span><strong>{info.bank_name}</strong></div>
          <div className={styles.w9SummaryRow}><span>Account #</span><strong>{'*'.repeat(info.account_number?.length - 4) + info.account_number?.slice(-4)}</strong></div>
          <div className={styles.w9SummaryRow}><span>Routing #</span><strong>{'*'.repeat(5) + info.routing_number?.slice(-4)}</strong></div>
        </>}
        {info.method === 'paypal' && <div className={styles.w9SummaryRow}><span>PayPal Email</span><strong>{info.paypal_email}</strong></div>}
        {info.method === 'wise'   && <div className={styles.w9SummaryRow}><span>Wise Email</span><strong>{info.wise_email}</strong></div>}
      </div>
      <button className={styles.editInfoBtn} onClick={() => setEditing(true)}>Edit Payment Info</button>
    </div>
  )

  return (
    <div className={styles.formCard}>
      <div className={styles.formCardHead}>
        <div className={styles.formCardTitle}>Payment Information</div>
        <div className={styles.formCardSub}>Choose how you'd like to receive payments from Arcvoy.</div>
      </div>

      <div className={styles.methodSelect}>
        {[['bank','Bank Transfer (ACH)'],['paypal','PayPal'],['wise','Wise']].map(([val, label]) => (
          <button key={val}
            className={`${styles.methodBtn} ${form.method === val ? styles.methodBtnActive : ''}`}
            onClick={() => set('method', val)}>
            {label}
          </button>
        ))}
      </div>

      <div className={styles.formGrid}>
        {form.method === 'bank' && <>
          <div className={styles.fg2}>
            <label className={styles.fl2}>Account Holder Name *</label>
            <input className={styles.fi2} value={form.account_name} placeholder="Name on account"
              onChange={e => set('account_name', e.target.value)} />
          </div>
          <div className={styles.fg2}>
            <label className={styles.fl2}>Bank Name *</label>
            <input className={styles.fi2} value={form.bank_name} placeholder="e.g. Chase, Bank of America"
              onChange={e => set('bank_name', e.target.value)} />
          </div>
          <div className={styles.fg2}>
            <label className={styles.fl2}>Account Number *</label>
            <input className={styles.fi2} value={form.account_number} placeholder="Account number"
              onChange={e => set('account_number', e.target.value.replace(/\D/g,''))} type="text" inputMode="numeric" />
          </div>
          <div className={styles.fg2}>
            <label className={styles.fl2}>Routing Number *</label>
            <input className={styles.fi2} value={form.routing_number} placeholder="9-digit routing number"
              onChange={e => set('routing_number', e.target.value.replace(/\D/g,'').slice(0,9))} type="text" inputMode="numeric" />
          </div>
        </>}
        {form.method === 'paypal' && (
          <div className={`${styles.fg2} ${styles.colSpan2}`}>
            <label className={styles.fl2}>PayPal Email *</label>
            <input className={styles.fi2} value={form.paypal_email} placeholder="your@paypal.com"
              onChange={e => set('paypal_email', e.target.value)} type="email" />
          </div>
        )}
        {form.method === 'wise' && (
          <div className={`${styles.fg2} ${styles.colSpan2}`}>
            <label className={styles.fl2}>Wise Email *</label>
            <input className={styles.fi2} value={form.wise_email} placeholder="your@wise.com"
              onChange={e => set('wise_email', e.target.value)} type="email" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {editing && <button className={styles.cancelFormBtn} onClick={() => setEditing(false)}>Cancel</button>}
        <button className={styles.submitFormBtn} onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Save Payment Info →'}
        </button>
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function Dashboard({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('applications')
  const [apps,    setApps]    = useState([])
  const [w9,      setW9]      = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { onNavigate('home'); return }
    const load = async () => {
      try {
        const [{ data }, w9data] = await Promise.all([
          supabase.from('applications').select('*').eq('email', user.email).order('created_at', { ascending: false }),
          getW9(user.id),
        ])
        setApps(data || [])
        setW9(w9data)
      } catch { setApps([]) }
      setLoading(false)
    }
    load()
  }, [user, onNavigate])

  const logout = async () => { await supabase.auth.signOut(); onNavigate('home') }

  const withdraw = async id => {
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return
    const { error } = await supabase.from('applications').delete().eq('id', id)
    if (error) { toast.error('Could not withdraw. Please try again.'); return }
    setApps(prev => prev.filter(a => a.id !== id))
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Candidate'
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isHired     = apps.some(a => a.status === 'hired')

  return (
    <div className={styles.page}>
      {/* header */}
      <div className={styles.topBar}>
        <div className={styles.userChip}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={logout} style={{ fontSize: 11 }}>Sign Out</button>
      </div>

      {/* tabs */}
      <div className={styles.tabBar}>
        {[
          { id: 'applications', label: 'Applications' },
          { id: 'w9',           label: 'W-9 Tax Form', locked: !isHired && !w9 },
          { id: 'payment',      label: 'Payment Info',  locked: !w9 },
        ].map(t => (
          <button key={t.id}
            className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.locked && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5, opacity: .5 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <AnimatePresence mode="wait">

          {/* ── Applications tab ── */}
          {activeTab === 'applications' && (
            <motion.div key="applications"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>

              {loading ? (
                <div className={styles.statsRow}>
                  {[0,1,2].map(i => (
                    <div key={i} className={styles.statCard}>
                      <span className={styles.skeletonLine} style={{ width: 32, height: 32, borderRadius: 8 }} />
                      <span className={styles.skeletonLine} style={{ width: '55%', height: 36, marginTop: 10 }} />
                      <span className={styles.skeletonLine} style={{ width: '40%', height: 10, marginTop: 8 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div className={styles.statsRow}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}>
                  {[
                    { label: 'Total Applied', value: apps.length,
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                    { label: 'In Progress',   value: apps.filter(a => ['reviewing','interviewed','offered'].includes(a.status)).length,
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                    { label: 'Hired',         value: apps.filter(a => a.status === 'hired').length,
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                  ].map((s, i) => (
                    <motion.div key={s.label} className={styles.statCard}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}>
                      <div className={styles.statIcon}>{s.icon}</div>
                      <span className={styles.statNum}>{s.value}</span>
                      <span className={styles.statLabel}>{s.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <div className={styles.sectionHead}>
                <div className="label">Your Applications</div>
                <button className="btn-ghost" onClick={() => onNavigate('jobs')} style={{ fontSize: 10 }}>Browse More Roles →</button>
              </div>

              {loading ? (
                <div className={styles.list}>
                  {[0,1,2].map(i => (
                    <div key={i} className={styles.card}>
                      <span className={styles.skeletonLine} style={{ width: '50%', height: 18, display: 'block', marginBottom: 10 }} />
                      <span className={styles.skeletonLine} style={{ width: '32%', height: 12, display: 'block', marginBottom: 8 }} />
                      <span className={styles.skeletonLine} style={{ width: '100%', height: 20, display: 'block', marginTop: 12, borderRadius: 8 }} />
                    </div>
                  ))}
                </div>
              ) : apps.length === 0 ? (
                <div className={styles.emptyBox}>
                  <div className={styles.emptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <p>No applications yet. Find a role that fits you.</p>
                  <button className="btn-primary" onClick={() => onNavigate('jobs')}>Browse Open Roles →</button>
                </div>
              ) : (
                <div className={styles.list}>
                  {apps.map((a, i) => (
                    <motion.div key={a.id} className={styles.card}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardLeft}>
                          <div className={styles.role}>{a.job_title}</div>
                          <div className={styles.meta}>{a.job_dept} · {a.job_type}</div>
                          <div className={styles.date}>Applied {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        {a.status === 'applied' && (
                          <button className={styles.withdrawBtn} onClick={() => withdraw(a.id)}>Withdraw</button>
                        )}
                      </div>
                      <Timeline status={a.status || 'applied'} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── W-9 tab ── */}
          {activeTab === 'w9' && (
            <motion.div key="w9"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <W9Tab user={user} apps={apps} />
            </motion.div>
          )}

          {/* ── Payment tab ── */}
          {activeTab === 'payment' && (
            <motion.div key="payment"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <PaymentTab user={user} w9={w9} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
