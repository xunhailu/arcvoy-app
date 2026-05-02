import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchJob } from '../lib/jobs'
import { submitApplication } from '../lib/applications'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'
import CustomSelect from '../components/CustomSelect'
import { STATES_BY_COUNTRY } from '../data/states'
import styles from './Apply.module.css'

export default function Apply({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [cvFile, setCvFile] = useState(null)
  const [cvLabel, setCvLabel] = useState('Drop your CV here or browse')
  const [parsing, setParsing] = useState(false)

  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [fields, setFields] = useState(() => {
    const meta = user?.user_metadata || {}
    const nameParts = (meta.full_name || '').trim().split(/\s+/)
    return {
      first: nameParts[0] || '', last: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      dobDay: '', dobMonth: '', dobYear: '',
      country: '', state: '', city: '', zip: '', address: '',
      linkedin: meta.linkedin || '',
      lang1: '', lang2: ''
    }
  })

  useEffect(() => {
    if (!id) { setLoading(false); return }
    fetchJob(id).then(setJob).catch(() => setJob(null)).finally(() => setLoading(false))
  }, [id])

  useSEO({ title: job ? `Apply — ${job.title}` : 'Apply', description: null })

  const countries = ['United States','United Kingdom','Canada','Australia','Germany','France','China','India','Nigeria','Brazil','Japan','Italy','Spain','Netherlands','Sweden','Turkey','Poland','Denmark','Singapore','Other']
  const langs     = ['English','Spanish','French','German','Chinese','Arabic','Hindi','Portuguese']
  const stateOptions = STATES_BY_COUNTRY[fields.country] || []

  const DOB_DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1))
  const DOB_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DOB_MONTH_NUM = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }
  const maxYear = new Date().getFullYear() - 18
  const DOB_YEARS  = Array.from({ length: maxYear - 1929 }, (_, i) => String(maxYear - i))

  const set = k => e => setFields(f => ({ ...f, [k]: e.target.value }))
  const setCountry = v => setFields(f => ({ ...f, country: v, state: '' }))

  const validate = () => {
    const e = {}
    if (!fields.first.trim())   e.first   = true
    if (!fields.last.trim())    e.last    = true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = true
    if (!fields.country)        e.country = true
    if (!fields.state.trim())   e.state   = true
    if (!fields.city.trim())    e.city    = true
    if (!fields.zip.trim())     e.zip     = true
    if (!fields.address.trim()) e.address = true
    if (!ageConfirmed) e.age = true
    if (!cvFile) e.cv = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const dob = fields.dobYear && fields.dobMonth && fields.dobDay
        ? `${fields.dobYear}-${DOB_MONTH_NUM[fields.dobMonth]}-${String(fields.dobDay).padStart(2, '0')}`
        : null
      await submitApplication({ fields: { ...fields, dob }, cvFile, job })
      setDone(true)
    } catch (err) {
      console.error('Application error:', err)
      setSubmitError(err.message === 'You have already applied for this role.'
        ? 'You have already applied for this role.'
        : 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
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

      {/* breadcrumb */}
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
                  ['Department',  job.dept],
                  ['Work Type',   job.type],
                  ['Pay Rate',    job.salary],
                  ['Contract',    'Flexible'],
                  ['Payment',     'Weekly'],
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

            <button className={styles.backBtn} onClick={() => navigate(`/jobs/${id}`)}>
              ← Back to job details
            </button>
          </motion.div>
        </aside>

        {/* right — form */}
        <main className={styles.main}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>

            <div className={styles.formHead}>
              <div className={styles.formLabel}>Application</div>
              <h1 className={styles.formTitle}>Apply for {job.title}</h1>
              <p className={styles.formSub}>Fill in your details below. All fields marked with * are required.</p>
            </div>

            <div className={styles.form}>

              {/* ── CV first — auto-fills the form below ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>CV / Resume <span className={styles.sectionRequired}>*</span></div>
                <div className={styles.cvUpload} style={{ borderColor: errors.cv ? '#a03030' : undefined }}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={async e => {
                    const f = e.target.files[0]
                    if (!f) return
                    if (f.size > 10 * 1024 * 1024) { setCvFile(null); setCvLabel('File too large — max 10MB'); setErrors(er => ({ ...er, cv: true })); return }
                    setCvFile(f); setCvLabel(f.name); setErrors(er => ({ ...er, cv: false }))
                    if (f.type === 'application/pdf') {
                      setParsing(true); setCvLabel('Reading your CV…')
                      try {
                        const base64 = await new Promise((res, rej) => {
                          const r = new FileReader()
                          r.onload = () => res(r.result.split(',')[1])
                          r.onerror = rej
                          r.readAsDataURL(f)
                        })
                        const { data, error: fnError } = await supabase.functions.invoke('parse-cv', {
                          body: { fileBase64: base64, fileType: f.type }
                        })
                        console.log('parse-cv result:', data, fnError)
                        if (data && !data.error) {
                          const match = (val, list) => list.find(o => o.toLowerCase() === (val || '').toLowerCase()) || null
                          const parseDOB = raw => {
                            if (!raw) return {}
                            const d = new Date(raw)
                            if (isNaN(d.getTime())) return {}
                            return {
                              dobDay:   String(d.getUTCDate()),
                              dobMonth: DOB_MONTHS[d.getUTCMonth()],
                              dobYear:  String(d.getUTCFullYear()),
                            }
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
                      } catch (err) { console.error('parse-cv error:', err) }
                      setCvLabel(f.name); setParsing(false)
                    }
                  }} />
                  <div className={styles.cvInner}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div>
                      <div className={styles.cvMain}>{cvLabel}</div>
                      <div className={styles.cvSub}>{parsing ? 'Filling in your details below…' : 'Upload your CV to auto-fill the form · PDF or DOCX · Max 10MB'}</div>
                    </div>
                    <span className={styles.cvBrowse}>Browse</span>
                  </div>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Personal Information ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Personal Information</div>
                <div className={styles.grid2}>
                  <div className={styles.fg}>
                    <label className={styles.fl}>First Name <span>*</span></label>
                    <input className={`${styles.fi} ${errors.first ? styles.fiError : ''}`} value={fields.first} onChange={set('first')} />
                  </div>
                  <div className={styles.fg}>
                    <label className={styles.fl}>Surname <span>*</span></label>
                    <input className={`${styles.fi} ${errors.last ? styles.fiError : ''}`} value={fields.last} onChange={set('last')} />
                  </div>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Email <span>*</span></label>
                  <input type="email" className={`${styles.fi} ${errors.email ? styles.fiError : ''}`} value={fields.email} onChange={set('email')} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Date of Birth</label>
                  <div className={styles.grid3}>
                    <CustomSelect value={fields.dobDay}   onChange={v => setFields(f => ({ ...f, dobDay: v }))}   options={DOB_DAYS}   placeholder="Day" />
                    <CustomSelect value={fields.dobMonth} onChange={v => setFields(f => ({ ...f, dobMonth: v }))} options={DOB_MONTHS} placeholder="Month" />
                    <CustomSelect value={fields.dobYear}  onChange={v => setFields(f => ({ ...f, dobYear: v }))}  options={DOB_YEARS}  placeholder="Year" />
                  </div>
                </div>
                <label className={`${styles.ageCheck} ${errors.age ? styles.ageCheckError : ''}`}>
                  <input type="checkbox" checked={ageConfirmed}
                    onChange={e => { setAgeConfirmed(e.target.checked); setErrors(er => ({ ...er, age: false })) }} />
                  <span className={`${styles.ageBox} ${ageConfirmed ? styles.ageBoxChecked : ''}`}>
                    {ageConfirmed && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 3.5 3.5 6 8 1"/>
                      </svg>
                    )}
                  </span>
                  <span className={styles.ageLabel}>I confirm I am 18 years of age or older <span>*</span></span>
                </label>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Location ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Location</div>
                <div className={styles.grid2}>
                  <div className={styles.fg}>
                    <label className={styles.fl}>Country <span>*</span></label>
                    <CustomSelect value={fields.country} onChange={setCountry} options={countries} placeholder="Select country" error={errors.country} />
                  </div>
                  <div className={styles.fg}>
                    <label className={styles.fl}>{stateOptions.length > 0 ? 'State / Province' : 'State / Region'} <span>*</span></label>
                    {stateOptions.length > 0
                      ? <CustomSelect value={fields.state} onChange={v => setFields(f => ({ ...f, state: v }))} options={stateOptions} placeholder="Select state" error={errors.state} />
                      : <input className={`${styles.fi} ${errors.state ? styles.fiError : ''}`} value={fields.state} onChange={set('state')} placeholder={fields.country ? 'Enter state or region' : ''} />
                    }
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.fg}>
                    <label className={styles.fl}>City / Town <span>*</span></label>
                    <input className={`${styles.fi} ${errors.city ? styles.fiError : ''}`} value={fields.city} onChange={set('city')} />
                  </div>
                  <div className={styles.fg}>
                    <label className={styles.fl}>Postcode / Zip <span>*</span></label>
                    <input className={`${styles.fi} ${errors.zip ? styles.fiError : ''}`} value={fields.zip} onChange={set('zip')} />
                  </div>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Street Address <span>*</span></label>
                  <input
                    className={`${styles.fi} ${styles.fiAddress} ${errors.address ? styles.fiError : ''}`}
                    value={fields.address}
                    onChange={set('address')}
                    placeholder="House number, street name, apartment / suite"
                  />
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Professional ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Professional</div>
                <div className={styles.fg}>
                  <label className={styles.fl}>LinkedIn Profile</label>
                  <input className={styles.fi} value={fields.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div className={styles.grid2}>
                  <div className={styles.fg}>
                    <label className={styles.fl}>Primary Language</label>
                    <CustomSelect value={fields.lang1} onChange={v => setFields(f => ({ ...f, lang1: v }))} options={langs} placeholder="Native language" />
                  </div>
                  <div className={styles.fg}>
                    <label className={styles.fl}>Additional Language</label>
                    <CustomSelect value={fields.lang2} onChange={v => setFields(f => ({ ...f, lang2: v }))} options={langs} placeholder="Other language (optional)" />
                  </div>
                </div>
              </div>

              {submitError && <div className={styles.submitError}>{submitError}</div>}

              <div className={styles.formFooter}>
                <button className="btn-primary" style={{ padding: '14px 36px' }} onClick={submit} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Application →'}
                </button>
                <p className={styles.footerNote}>By submitting you agree to our <button className={styles.inlineLink} onClick={() => navigate('/privacy')}>Privacy Policy</button>.</p>
              </div>

            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
