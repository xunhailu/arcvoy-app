import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitApplication } from '../lib/applications'
import CustomSelect from './CustomSelect'
import { STATES_BY_COUNTRY } from '../data/states'

export default function ApplyPanel({ job, onClose, onSubmit, user }) {
  const navigate = useNavigate()
  const [fields, setFields] = useState(() => {
    const meta = user?.user_metadata || {}
    const nameParts = (meta.full_name || '').trim().split(/\s+/)
    return {
      first:   nameParts[0] || '',
      last:    nameParts.slice(1).join(' ') || '',
      email:   user?.email || '',
      country: '', state: '', city: '',
      zip: '', address: '', linkedin: meta.linkedin || '', lang1: '', lang2: '', dob: ''
    }
  })
  const [cvFile, setCvFile] = useState(null)
  const [cvLabel, setCvLabel] = useState('Drop your CV here or browse')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = k => e => setFields(f => ({ ...f, [k]: e.target.value }))

  const setCountry = v => setFields(f => ({ ...f, country: v, state: '' }))

  const dobDays = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
  const dobMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dobYears = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - 18 - i))

  const dobParts = fields.dob ? fields.dob.split('-') : ['', '', '']
  const dobYear = dobParts[0] || ''
  const dobMonth = dobParts[1] || ''
  const dobDay = dobParts[2] || ''

  const setDobPart = (part, val) => {
    const y = part === 'y' ? val : dobYear
    const m = part === 'm' ? String(dobMonths.indexOf(val) + 1).padStart(2, '0') : dobMonth
    const d = part === 'd' ? val : dobDay
    setFields(f => ({ ...f, dob: (y && m && d) ? `${y}-${m}-${d}` : '' }))
  }

  const stateOptions = STATES_BY_COUNTRY[fields.country] || []

  const validate = () => {
    const e = {}
    if (!fields.first.trim())  e.first = true
    if (!fields.last.trim())   e.last  = true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = true
    if (!fields.address.trim()) e.address = true
    if (!cvFile)        e.cv    = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setSubmitError('')
    try {
      await submitApplication({ fields, cvFile, job })
      onSubmit && onSubmit({ name: `${fields.first} ${fields.last}`, job: job.title })
      setDone(true)
    } catch (err) {
      console.error(err)
      setSubmitError(err.message === 'You have already applied for this role.'
        ? 'You have already applied for this role.'
        : 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (done) return (
    <div className="success-view">
      <div className="suc-icon">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 11 9 16 18 6"/>
        </svg>
      </div>
      <div className="suc-h">Application Received</div>
      <p className="suc-msg">We've received your application and will review it shortly. Expect a response within 48 hours.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {user && (
          <button className="btn-primary" onClick={() => { onClose(); navigate('/dashboard') }}>
            View Dashboard →
          </button>
        )}
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  )

  const countries = ['United States','United Kingdom','Canada','Australia','Germany','France','China','India','Nigeria','Brazil','Japan','Italy','Spain','Netherlands','Sweden','Turkey','Poland','Denmark','Singapore','Other']
  const langs = ['English','Spanish','French','German','Chinese','Arabic','Hindi','Portuguese']

  return (
    <>
      <div className="panel-head">
        <div>
          <div className="panel-dept">{job.dept} · {job.type}</div>
          <div className="panel-title">{job.title}</div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
          </svg>
        </button>
      </div>

      <div className="panel-body">
        <div className="fg2">
          <div className="fg">
            <label className="fl">First Name <span>*</span></label>
            <input className={`fi ${errors.first ? 'fi-error' : ''}`} value={fields.first} onChange={set('first')} />
          </div>
          <div className="fg">
            <label className="fl">Surname <span>*</span></label>
            <input className={`fi ${errors.last ? 'fi-error' : ''}`} value={fields.last} onChange={set('last')} />
          </div>
        </div>

        <div className="fg">
          <label className="fl">Email <span>*</span></label>
          <input type="email" className={`fi ${errors.email ? 'fi-error' : ''}`} value={fields.email} onChange={set('email')} />
        </div>

        <div className="fg">
          <label className="fl">Date of Birth</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 8 }}>
            <CustomSelect
              value={dobDay}
              onChange={v => setDobPart('d', v)}
              options={dobDays}
              placeholder="Day"
            />
            <CustomSelect
              value={dobMonth ? dobMonths[parseInt(dobMonth, 10) - 1] : ''}
              onChange={v => setDobPart('m', v)}
              options={dobMonths}
              placeholder="Month"
            />
            <CustomSelect
              value={dobYear}
              onChange={v => setDobPart('y', v)}
              options={dobYears}
              placeholder="Year"
            />
          </div>
        </div>

        <div className="fg">
          <label className="fl">Country</label>
          <CustomSelect
            value={fields.country}
            onChange={setCountry}
            options={countries}
            placeholder="Select country"
          />
        </div>

        <div className="fg2">
          <div className="fg">
            <label className="fl">
              {stateOptions.length > 0 ? 'State / Province' : 'State'}
            </label>
            {stateOptions.length > 0 ? (
              <CustomSelect
                value={fields.state}
                onChange={v => setFields(f => ({ ...f, state: v }))}
                options={stateOptions}
                placeholder="Select state"
              />
            ) : (
              <input
                className="fi"
                value={fields.state}
                onChange={set('state')}
                placeholder={fields.country ? 'Enter state / region' : ''}
              />
            )}
          </div>
          <div className="fg">
            <label className="fl">City / Town</label>
            <input className="fi" value={fields.city} onChange={set('city')} />
          </div>
        </div>

        <div className="fg2">
          <div className="fg"><label className="fl">Zip Code</label><input className="fi" value={fields.zip} onChange={set('zip')} /></div>
          <div className="fg">
            <label className="fl">House Address <span>*</span></label>
            <input className={`fi ${errors.address ? 'fi-error' : ''}`} value={fields.address} onChange={set('address')} />
          </div>
        </div>

        <div className="fg"><label className="fl">LinkedIn</label><input className="fi" value={fields.linkedin} onChange={set('linkedin')} /></div>

        <div className="fg">
          <label className="fl">Upload CV (PDF/DOCX) <span>*</span></label>
          <div className={`cv-upload`} style={{ border: errors.cv ? '1px solid #a03030' : 'none' }}>
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => {
              const f = e.target.files[0]
              if (!f) return
              if (f.size > 10 * 1024 * 1024) {
                setCvFile(null); setCvLabel('File too large — max 10MB')
                setErrors(er => ({ ...er, cv: true }))
                return
              }
              setCvFile(f); setCvLabel(f.name); setErrors(er => ({ ...er, cv: false }))
            }} />
            <div className="cv-drop">
              <div className="cv-drop-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="cv-drop-main">{cvLabel}</div>
                <div className="cv-drop-sub">PDF or DOCX · Max 10MB</div>
              </div>
              <div className="cv-btn">Browse</div>
            </div>
          </div>
        </div>

        <div className="fg2">
          <div className="fg">
            <label className="fl">Language 1</label>
            <CustomSelect
              value={fields.lang1}
              onChange={v => setFields(f => ({ ...f, lang1: v }))}
              options={langs}
              placeholder="Select language"
            />
          </div>
          <div className="fg">
            <label className="fl">Language 2</label>
            <CustomSelect
              value={fields.lang2}
              onChange={v => setFields(f => ({ ...f, lang2: v }))}
              options={langs}
              placeholder="Select language"
            />
          </div>
        </div>

        {submitError && <div style={{ fontSize: 12, color: '#E24B4A', marginTop: 8 }}>{submitError}</div>}
      </div>

      <div className="panel-foot">
        <button className="sub-btn" onClick={submit} disabled={loading}>
          {loading ? <><div className="spinner" /> Submitting…</> : 'Submit Application →'}
        </button>
      </div>
    </>
  )
}
