import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchJob } from '../lib/jobs'
import { submitApplication } from '../lib/applications'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'
import CustomSelect from '../components/CustomSelect'
import { STATES_BY_COUNTRY } from '../data/states'
import styles from './Apply.module.css'

const STEPS = ['Documents', 'Your Details', 'Professional']

const ERROR_MESSAGES = {
  first:   'First name is required',
  last:    'Surname is required',
  email:   'Enter a valid email address',
  country: 'Please select your country',
  state:   'State or region is required',
  city:    'City is required',
  zip:     'Postcode is required',
  address: 'Street address is required',
  age:     'You must confirm you are 18 or older to apply',
  dob:     'Date of birth is required',
  cv:      'Please upload your CV to continue',
  id:      'Please upload a valid government-issued photo ID',
}

function StepBar({ current }) {
  return (
    <div className={styles.stepBar}>
      {STEPS.map((label, i) => {
        const num  = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={num} className={styles.stepBarItem}>
            <div className={`${styles.stepCircle} ${done ? styles.stepCircleDone : active ? styles.stepCircleActive : styles.stepCircleUpcoming}`}>
              {done
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : num}
            </div>
            <span className={`${styles.stepBarLabel} ${done ? styles.stepBarLabelDone : active ? styles.stepBarLabelActive : styles.stepBarLabelUpcoming}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepConnector} ${done ? styles.stepConnectorDone : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Apply({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const storageKey = id ? `arcvoy-apply-${id}` : null

  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(() => Boolean(id))
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors]     = useState({})
  const [cvFile, setCvFile]     = useState(null)
  const [cvLabel, setCvLabel]   = useState('Drop your CV here or browse')
  const [cvWarning, setCvWarning] = useState('')
  const [parsing, setParsing]   = useState(false)
  const [idFile, setIdFile]     = useState(null)
  const [idLabel, setIdLabel]   = useState('Upload a government-issued photo ID')
  const [idParsing, setIdParsing] = useState(false)
  const [idVerified, setIdVerified] = useState(false)
  const [step, setStep]         = useState(1)
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  const [fields, setFields] = useState(() => {
    const meta = user?.user_metadata || {}
    const nameParts = (meta.full_name || '').trim().split(/\s+/)
    let saved = {}
    if (storageKey) {
      try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch {}
    }
    return {
      first: saved.first || nameParts[0] || '', last: saved.last || nameParts.slice(1).join(' ') || '',
      email: saved.email || user?.email || '',
      dobDay: saved.dobDay || '', dobMonth: saved.dobMonth || '', dobYear: saved.dobYear || '',
      country: saved.country || '', state: saved.state || '', city: saved.city || '',
      zip: saved.zip || '', address: saved.address || '',
      linkedin: saved.linkedin || meta.linkedin || '',
      lang1: saved.lang1 || '', lang2: saved.lang2 || '',
    }
  })

  useEffect(() => {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, JSON.stringify(fields)) } catch {}
  }, [fields, storageKey])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchJob(id)
      .then(data => { if (!cancelled) setJob(data) })
      .catch(() => { if (!cancelled) setJob(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useSEO({ title: job ? `Apply — ${job.title}` : 'Apply', description: null })

  const countries    = ['United States','United Kingdom','Canada','Australia','Germany','France','China','India','Nigeria','Brazil','Japan','Italy','Spain','Netherlands','Sweden','Turkey','Poland','Denmark','Singapore','Other']
  const langs        = ['English','Spanish','French','German','Chinese','Arabic','Hindi','Portuguese']
  const stateOptions = STATES_BY_COUNTRY[fields.country] || []

  const DOB_DAYS    = Array.from({ length: 31 }, (_, i) => String(i + 1))
  const DOB_MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DOB_MONTH_NUM = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }
  const maxYear     = new Date().getFullYear() - 18
  const DOB_YEARS   = Array.from({ length: maxYear - 1929 }, (_, i) => String(maxYear - i))

  const set = k => e => {
    setFields(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: false }))
  }

  const setCountry = v => {
    setFields(f => ({ ...f, country: v, state: '' }))
    if (errors.country) setErrors(prev => ({ ...prev, country: false }))
  }

  const blurCheck = (key) => {
    const val = fields[key]
    let invalid = false
    if (key === 'email') invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    else invalid = !String(val || '').trim()
    setErrors(prev => ({ ...prev, [key]: invalid }))
  }

  const validateStep1 = () => {
    const e = {}
    if (parsing) e.cv = true
    if (idParsing || !idFile) e.id = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!fields.first.trim())   e.first   = true
    if (!fields.last.trim())    e.last    = true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = true
    if (!fields.country)        e.country = true
    if (!fields.state.trim())   e.state   = true
    if (!fields.city.trim())    e.city    = true
    if (!fields.zip.trim())     e.zip     = true
    if (!fields.address.trim()) e.address = true
    if (!ageConfirmed)          e.age     = true
    if (!fields.dobDay || !fields.dobMonth || !fields.dobYear) e.dob = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    const valid = step === 1 ? validateStep1() : validateStep2()
    if (!valid) return
    setErrors({})
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setErrors({})
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const dob = fields.dobYear && fields.dobMonth && fields.dobDay
        ? `${fields.dobYear}-${DOB_MONTH_NUM[fields.dobMonth]}-${String(fields.dobDay).padStart(2, '0')}`
        : null
      await submitApplication({ fields: { ...fields, dob }, cvFile, idFile, job })
      if (storageKey) { try { localStorage.removeItem(storageKey) } catch {} }
      setDone(true)
    } catch (err) {
      setSubmitError(err.message === 'You have already applied for this role.'
        ? 'You have already applied for this role.'
        : 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const ALLOWED_CV_TYPES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  const handleCVUpload = async (f) => {
    if (!f) return
    setCvWarning('')
    if (!ALLOWED_CV_TYPES.includes(f.type)) {
      setCvFile(null)
      setCvLabel('Invalid file type — PDF or Word only')
      setErrors(prev => ({ ...prev, cv: true }))
      return
    }
    if (f.size < 5 * 1024) {
      setCvFile(null)
      setCvLabel('File too small to be a CV — please upload your actual CV')
      setErrors(prev => ({ ...prev, cv: true }))
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setCvFile(null)
      setCvLabel('File too large — max 10MB')
      setErrors(prev => ({ ...prev, cv: true }))
      return
    }
    setCvFile(f)
    setCvLabel(f.name)
    setErrors(prev => ({ ...prev, cv: false }))
    if (f.type === 'application/pdf') {
      setParsing(true)
      setCvLabel('Verifying your CV…')
      let rejected = false
      try {
        const base64 = await new Promise((res, rej) => {
          const r = new FileReader()
          r.onload  = () => res(r.result.split(',')[1])
          r.onerror = rej
          r.readAsDataURL(f)
        })
        const { data } = await supabase.functions.invoke('parse-cv', {
          body: { fileBase64: base64, fileType: f.type },
        })
        if (data && !data.error) {
          if (data.is_cv === false) {
            setCvFile(null)
            setCvLabel('This does not appear to be a CV — please upload your actual CV')
            setErrors(prev => ({ ...prev, cv: true }))
            rejected = true
          } else {
            const usefulFields = ['first','last','email','address','city','zip','linkedin','country','state','dob']
            const hasContent = usefulFields.some(k => data[k] && String(data[k]).trim())
            if (!hasContent) setCvWarning('We could not read text from your file. If your CV is a scanned image, please export it as a text-based PDF.')
            const match = (val, list) => list.find(o => o.toLowerCase() === (val || '').toLowerCase()) || null
            const parseDOB = raw => {
              if (!raw) return {}
              const d = new Date(raw)
              if (isNaN(d.getTime())) return {}
              return { dobDay: String(d.getUTCDate()), dobMonth: DOB_MONTHS[d.getUTCMonth()], dobYear: String(d.getUTCFullYear()) }
            }
            setFields(prev => ({
              ...prev,
              first:    data.first    || prev.first,
              last:     data.last     || prev.last,
              email:    data.email    || prev.email,
              ...parseDOB(data.dob),
              address:  data.address  || prev.address,
              city:     data.city     || prev.city,
              zip:      data.zip      || prev.zip,
              linkedin: data.linkedin || prev.linkedin,
              country:  match(data.country, countries) || prev.country,
              state:    data.state    || prev.state,
              lang1:    match(data.lang1, langs) || prev.lang1,
              lang2:    match(data.lang2, langs) || prev.lang2,
            }))
          }
        }
      } catch { /* parsing is best-effort — allow through on network/API failure */ }
      if (!rejected) setCvLabel(f.name)
      setParsing(false)
    }
  }

  const ALLOWED_ID_TYPES = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf']

  const handleIDUpload = async (f) => {
    if (!f) return
    if (!ALLOWED_ID_TYPES.includes(f.type)) {
      setIdFile(null)
      setIdLabel('Invalid file type — JPEG, PNG, or PDF only')
      setErrors(prev => ({ ...prev, id: true }))
      return
    }
    if (f.size < 10 * 1024) {
      setIdFile(null)
      setIdLabel('File too small — please upload a clear photo of your ID')
      setErrors(prev => ({ ...prev, id: true }))
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setIdFile(null)
      setIdLabel('File too large — max 10MB')
      setErrors(prev => ({ ...prev, id: true }))
      return
    }

    setIdVerified(false)
    setIdParsing(true)
    setIdLabel('Verifying your ID…')
    setErrors(prev => ({ ...prev, id: false }))

    let rejected = false
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(f)
      })
      const { data } = await supabase.functions.invoke('verify-id', {
        body: { fileBase64: base64, fileType: f.type },
      })
      if (data && !data.error) {
        if (data.is_id === false) {
          setIdFile(null)
          setIdLabel('This does not appear to be a government-issued ID — please try again')
          setErrors(prev => ({ ...prev, id: true }))
          rejected = true
        } else {
          setIdVerified(true)
          const match = (val, list) => list.find(o => o.toLowerCase() === (val || '').toLowerCase()) || null
          const parseDOB = raw => {
            if (!raw) return {}
            const d = new Date(raw)
            if (isNaN(d.getTime())) return {}
            return { dobDay: String(d.getUTCDate()), dobMonth: DOB_MONTHS[d.getUTCMonth()], dobYear: String(d.getUTCFullYear()) }
          }
          setFields(prev => ({
            ...prev,
            first:   data.first   || prev.first,
            last:    data.last    || prev.last,
            ...parseDOB(data.dob),
            address: data.address || prev.address,
            city:    data.city    || prev.city,
            zip:     data.zip     || prev.zip,
            country: match(data.country, countries) || prev.country,
            state:   data.state   || prev.state,
          }))
        }
      }
    } catch { /* verification is best-effort — allow through on network/API failure */ }

    if (!rejected) {
      setIdFile(f)
      setIdLabel(f.name)
    }
    setIdParsing(false)
  }

  if (loading) return null
  if (!job) return <Navigate to="/jobs" replace />

  if (done) return (
    <div className={styles.successPage}>
      <motion.div className={styles.successCard}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className={styles.successIcon}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 11 9 16 18 6"/>
          </svg>
        </div>
        <h2 className={styles.successTitle}>Application submitted</h2>
        <p className={styles.successDesc}>Your application for <strong>{job.title}</strong> is under review. A confirmation has been sent to <strong>{fields.email}</strong>.</p>
        <p className={styles.successSpam}>Did not see it? Check your <strong>spam or junk folder</strong> and mark it as not spam to receive future updates.</p>
        <div className={styles.successBtns}>
          {user && <button className="btn-primary" onClick={() => navigate('/dashboard')}>View Dashboard →</button>}
          <button className="btn-ghost" onClick={() => navigate('/jobs')}>Browse More Roles</button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className={styles.page}>

      <div className={styles.breadcrumb}>
        <button className={styles.bcLink} onClick={() => navigate('/')}>Home</button>
        <span className={styles.bcSep}>/</span>
        <button className={styles.bcLink} onClick={() => navigate('/jobs')}>Careers</button>
        <span className={styles.bcSep}>/</span>
        <button className={styles.bcLink} onClick={() => navigate(`/jobs/${id}`)}>{job.title}</button>
        <span className={styles.bcSep}>/</span>
        <span className={styles.bcCurrent}>Apply</span>
      </div>

      <div className={styles.layout}>

        {/* left — job summary */}
        <aside className={styles.sidebar}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className={styles.jobCard}>
              <div className={styles.cardLine} />
              <div className={styles.jobDept}>{job.dept} · {job.type}</div>
              <h2 className={styles.jobTitle}>{job.title}</h2>
              <div className={styles.jobSalary}>{job.salary}</div>
              <div className={styles.divider} />
              <div className={styles.metaList}>
                {[
                  ['Department', job.dept],
                  ['Work Type',  job.type],
                  ['Pay Rate',   job.salary],
                  ['Contract',   'Flexible'],
                  ['Payment',    'Weekly'],
                ].map(([k, v]) => (
                  <div key={k} className={styles.metaRow}>
                    <span>{k}</span><strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.divider} />
              <div className={styles.reqLabel}>Requirements</div>
              <div className={styles.reqTags}>
                {(job.reqs || []).map(r => <span key={r} className={styles.reqTag}>{r}</span>)}
              </div>
              {job.locations?.length > 0 && (
                <>
                  <div className={styles.divider} />
                  <div className={styles.reqLabel}>Location</div>
                  <div className={styles.reqTags}>
                    {job.locations.map(l => <span key={l} className={styles.locTag}>{l}</span>)}
                  </div>
                </>
              )}
            </div>
            <button className={styles.backBtn} onClick={() => navigate(`/jobs/${id}`)}>← Back to job details</button>
          </motion.div>
        </aside>

        {/* right — multi-step form */}
        <main className={styles.main}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>

            <div className={styles.formHead}>
              <div className={styles.formLabel}>Application</div>
              <h1 className={styles.formTitle}>Apply for {job.title}</h1>
            </div>

            <StepBar current={step} />

            <AnimatePresence mode="wait">

              {/* ── Step 1: Documents ── */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}>
                  <div className={styles.stepHeading}>
                    <div className={styles.stepSubtitle}>Upload your documents below. CV is optional but speeds up the form.</div>
                  </div>
                  <div className={styles.form}>

                    {/* CV — optional */}
                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>CV / Résumé <span className={styles.optionalTag}>optional</span></div>
                      <div className={styles.cvUpload} style={{ borderColor: errors.cv ? '#a03030' : cvFile ? 'var(--gd)' : undefined }}>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleCVUpload(e.target.files[0])} />
                        <div className={styles.cvInner}>
                          {cvFile
                            ? <div className={styles.cvFileIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                </svg>
                              </div>
                            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                              </svg>}
                          <div>
                            <div className={styles.cvMain}>{cvLabel}</div>
                            <div className={styles.cvSub}>
                              {parsing ? 'Filling in your details…'
                                : cvFile ? 'CV ready — your details have been pre-filled below'
                                : 'Upload to auto-fill the form · PDF or DOCX · Max 10MB'}
                            </div>
                          </div>
                          <span className={`${styles.cvBrowse} ${cvFile ? styles.cvBrowseDone : ''}`}>
                            {cvFile ? '✓' : 'Browse'}
                          </span>
                        </div>
                      </div>
                      {errors.cv && <span className={styles.fieldError}>{ERROR_MESSAGES.cv}</span>}
                      {cvWarning && !errors.cv && (
                        <div className={styles.cvWarning}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          {cvWarning}
                        </div>
                      )}
                    </div>

                    <div className={styles.sectionDivider} />

                    {/* Government ID — required */}
                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Government-Issued ID <span style={{ color: 'var(--gd)' }}>*</span></div>
                      <p className={styles.stepSubtitle} style={{ marginBottom: 12, fontSize: 12 }}>
                        Accepted: passport, driver's licence, or national ID card. Front side required.
                      </p>
                      <div className={styles.cvUpload} style={{ borderColor: errors.id ? '#a03030' : idFile ? 'var(--gd)' : undefined }}>
                        <input type="file" accept="image/jpeg,image/png,image/webp,.pdf" onChange={e => handleIDUpload(e.target.files[0])} />
                        <div className={styles.cvInner}>
                          {idFile
                            ? <div className={styles.cvFileIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                                </svg>
                              </div>
                            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                              </svg>}
                          <div>
                            <div className={styles.cvMain}>{idLabel}</div>
                            <div className={styles.cvSub}>
                              {idParsing ? 'Checking your ID and pre-filling your details…'
                                : idVerified ? 'ID verified — your details have been pre-filled below'
                                : idFile ? 'ID uploaded successfully'
                                : 'JPEG, PNG, or PDF · Max 10MB · Required'}
                            </div>
                          </div>
                          <span className={`${styles.cvBrowse} ${idFile ? styles.cvBrowseDone : ''}`}>
                            {idFile ? '✓' : 'Browse'}
                          </span>
                        </div>
                      </div>
                      {errors.id && <span className={styles.fieldError}>{ERROR_MESSAGES.id}</span>}
                    </div>

                    <div className={styles.stepNav}>
                      <div />
                      <button className={styles.continueBtn} onClick={goNext} disabled={parsing || idParsing}>
                        {parsing ? 'Verifying CV…' : idParsing ? 'Verifying ID…' : 'Continue →'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Personal + Location ── */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}>
                  <div className={styles.stepHeading}>
                    <div className={styles.stepSubtitle}>Review your details below. Fields marked <span style={{ color: 'var(--gd)' }}>*</span> are required.</div>
                  </div>
                  <div className={styles.form}>

                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Personal Information</div>
                      <div className={styles.grid2}>
                        <div className={styles.fg}>
                          <label className={styles.fl}>First Name <span>*</span></label>
                          <input className={`${styles.fi} ${errors.first ? styles.fiError : ''}`}
                            value={fields.first} onChange={set('first')} onBlur={() => blurCheck('first')} />
                          {errors.first && <span className={styles.fieldError}>{ERROR_MESSAGES.first}</span>}
                        </div>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Surname <span>*</span></label>
                          <input className={`${styles.fi} ${errors.last ? styles.fiError : ''}`}
                            value={fields.last} onChange={set('last')} onBlur={() => blurCheck('last')} />
                          {errors.last && <span className={styles.fieldError}>{ERROR_MESSAGES.last}</span>}
                        </div>
                      </div>
                      <div className={styles.fg}>
                        <label className={styles.fl}>Email Address <span>*</span></label>
                        <input type="email" className={`${styles.fi} ${errors.email ? styles.fiError : ''}`}
                          value={fields.email} onChange={set('email')} onBlur={() => blurCheck('email')} />
                        {errors.email && <span className={styles.fieldError}>{ERROR_MESSAGES.email}</span>}
                      </div>
                      <div className={styles.fg}>
                        <label className={styles.fl}>Date of Birth <span>*</span></label>
                        <div className={styles.grid3}>
                          <CustomSelect value={fields.dobDay}   onChange={v => { setFields(f => ({ ...f, dobDay: v }));   setErrors(p => ({ ...p, dob: false })) }} options={DOB_DAYS}   placeholder="Day"   error={errors.dob} />
                          <CustomSelect value={fields.dobMonth} onChange={v => { setFields(f => ({ ...f, dobMonth: v })); setErrors(p => ({ ...p, dob: false })) }} options={DOB_MONTHS} placeholder="Month" error={errors.dob} />
                          <CustomSelect value={fields.dobYear}  onChange={v => { setFields(f => ({ ...f, dobYear: v }));  setErrors(p => ({ ...p, dob: false })) }} options={DOB_YEARS}  placeholder="Year"  error={errors.dob} />
                        </div>
                        {errors.dob && <span className={styles.fieldError}>{ERROR_MESSAGES.dob}</span>}
                      </div>
                      <div>
                        <label className={`${styles.ageCheck} ${errors.age ? styles.ageCheckError : ''}`}>
                          <input type="checkbox" checked={ageConfirmed}
                            onChange={e => { setAgeConfirmed(e.target.checked); setErrors(prev => ({ ...prev, age: false })) }} />
                          <span className={`${styles.ageBox} ${ageConfirmed ? styles.ageBoxChecked : ''}`}>
                            {ageConfirmed && (
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 3.5 3.5 6 8 1"/>
                              </svg>
                            )}
                          </span>
                          <span className={styles.ageLabel}>I confirm I am 18 years of age or older <span>*</span></span>
                        </label>
                        {errors.age && <span className={styles.fieldError} style={{ marginTop: 6, display: 'block' }}>{ERROR_MESSAGES.age}</span>}
                      </div>
                    </div>

                    <div className={styles.sectionDivider} />

                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Location</div>
                      <div className={styles.grid2}>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Country <span>*</span></label>
                          <CustomSelect value={fields.country} onChange={setCountry} options={countries} placeholder="Select country" error={errors.country} />
                          {errors.country && <span className={styles.fieldError}>{ERROR_MESSAGES.country}</span>}
                        </div>
                        <div className={styles.fg}>
                          <label className={styles.fl}>{stateOptions.length > 0 ? 'State / Province' : 'State / Region'} <span>*</span></label>
                          {stateOptions.length > 0
                            ? <CustomSelect value={fields.state} onChange={v => { setFields(f => ({ ...f, state: v })); setErrors(p => ({ ...p, state: false })) }} options={stateOptions} placeholder="Select state" error={errors.state} />
                            : <input className={`${styles.fi} ${errors.state ? styles.fiError : ''}`}
                                value={fields.state} onChange={set('state')} onBlur={() => blurCheck('state')}
                                placeholder={fields.country ? 'Enter state or region' : ''} />}
                          {errors.state && <span className={styles.fieldError}>{ERROR_MESSAGES.state}</span>}
                        </div>
                      </div>
                      <div className={styles.grid2}>
                        <div className={styles.fg}>
                          <label className={styles.fl}>City / Town <span>*</span></label>
                          <input className={`${styles.fi} ${errors.city ? styles.fiError : ''}`}
                            value={fields.city} onChange={set('city')} onBlur={() => blurCheck('city')} />
                          {errors.city && <span className={styles.fieldError}>{ERROR_MESSAGES.city}</span>}
                        </div>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Postcode / Zip <span>*</span></label>
                          <input className={`${styles.fi} ${errors.zip ? styles.fiError : ''}`}
                            value={fields.zip} onChange={set('zip')} onBlur={() => blurCheck('zip')} />
                          {errors.zip && <span className={styles.fieldError}>{ERROR_MESSAGES.zip}</span>}
                        </div>
                      </div>
                      <div className={styles.fg}>
                        <label className={styles.fl}>Street Address <span>*</span></label>
                        <input className={`${styles.fi} ${styles.fiAddress} ${errors.address ? styles.fiError : ''}`}
                          value={fields.address} onChange={set('address')} onBlur={() => blurCheck('address')}
                          placeholder="House number, street name, apartment / suite" />
                        {errors.address && <span className={styles.fieldError}>{ERROR_MESSAGES.address}</span>}
                      </div>
                    </div>

                    <div className={styles.stepNav}>
                      <button className={styles.backBtn2} onClick={goBack}>← Back</button>
                      <button className={styles.continueBtn} onClick={goNext}>Continue →</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Professional + Submit ── */}
              {step === 3 && (
                <motion.div key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}>
                  <div className={styles.stepHeading}>
                    <div className={styles.stepSubtitle}>Almost done. Add your professional details and submit.</div>
                  </div>
                  <div className={styles.form}>

                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Professional</div>
                      <div className={styles.fg}>
                        <label className={styles.fl}>LinkedIn Profile <span className={styles.optionalTag}>optional</span></label>
                        <input className={styles.fi} value={fields.linkedin} onChange={set('linkedin')}
                          placeholder="https://linkedin.com/in/yourname" />
                      </div>
                      <div className={styles.grid2}>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Primary Language <span className={styles.optionalTag}>optional</span></label>
                          <CustomSelect value={fields.lang1} onChange={v => setFields(f => ({ ...f, lang1: v }))} options={langs} placeholder="Native language" />
                        </div>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Additional Language <span className={styles.optionalTag}>optional</span></label>
                          <CustomSelect value={fields.lang2} onChange={v => setFields(f => ({ ...f, lang2: v }))} options={langs} placeholder="Other language" />
                        </div>
                      </div>
                    </div>

                    <div className={styles.sectionDivider} />

                    {/* review summary */}
                    <div className={styles.reviewBox}>
                      <div className={styles.reviewTitle}>Review before submitting</div>
                      <div className={styles.reviewGrid}>
                        <div className={styles.reviewItem}><span>Name</span><strong>{fields.first} {fields.last}</strong></div>
                        <div className={styles.reviewItem}><span>Email</span><strong>{fields.email}</strong></div>
                        <div className={styles.reviewItem}><span>Date of Birth</span><strong>{fields.dobDay && fields.dobMonth && fields.dobYear ? `${fields.dobDay} ${fields.dobMonth} ${fields.dobYear}` : '—'}</strong></div>
                        <div className={styles.reviewItem}><span>Location</span><strong>{[fields.city, fields.country].filter(Boolean).join(', ')}</strong></div>
                        <div className={styles.reviewItem}><span>CV</span><strong>{cvFile?.name || 'Not provided'}</strong></div>
                        <div className={styles.reviewItem}><span>ID Document</span><strong>{idFile?.name || '—'}</strong></div>
                        <div className={styles.reviewItem}><span>Role</span><strong>{job.title}</strong></div>
                      </div>
                      <button className={styles.reviewEdit} onClick={() => { setErrors({}); setStep(2) }}>Edit details</button>
                    </div>

                    {submitError && <div className={styles.submitError}>{submitError}</div>}

                    <div className={styles.stepNav}>
                      <button className={styles.backBtn2} onClick={goBack}>← Back</button>
                      <div className={styles.submitGroup}>
                        <button className={styles.submitBtn} onClick={submit} disabled={submitting}>
                          {submitting
                            ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting…</>
                            : 'Submit Application →'}
                        </button>
                        <p className={styles.footerNote}>
                          By submitting you agree to our <button className={styles.inlineLink} onClick={() => navigate('/privacy')}>Privacy Policy</button>.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
