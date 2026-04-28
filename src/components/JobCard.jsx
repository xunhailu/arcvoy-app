import { motion } from 'framer-motion'
import { useTilt } from '../hooks/useTilt'

export default function JobCard({ job, onClick, onApply, delay = 0, isBookmarked = false, onBookmark }) {
  const tilt = useTilt(6)

  return (
    <motion.div
      className="job-card"
      onClick={e => { if (window.getSelection()?.toString()) return; onClick(e) }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0, 0, 1] }}
      style={{ ...tilt.style, cursor: 'pointer' }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* shine overlay — tracks mouse position via useTilt */}
      <div data-shine style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        pointerEvents: 'none', transition: 'opacity .3s', opacity: 0,
      }} />

      <div className="job-top">
        <span className="job-dept">{job.dept}</span>
        <div className="job-right">
          <div className="job-type">{job.type}</div>
          <div className="job-salary">{job.salary}</div>
        </div>
      </div>

      <span className="job-title-text">{job.title}</span>
      <p className="job-desc">{job.desc}</p>

      {job.locations?.length > 0 && (
        <div className="job-locations">
          {job.locations.map(loc => (
            <span key={loc} className="loc-tag">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {loc}
            </span>
          ))}
        </div>
      )}

      <div className="job-tags">
        {job.reqs.map(r => <span key={r} className="chip">{r}</span>)}
      </div>

      <div className="job-cta-row">
        <button
          className="btn-primary"
          style={{ fontSize: '10px', padding: '8px 18px' }}
          onClick={e => { e.stopPropagation(); onApply ? onApply(job) : onClick(e) }}
        >
          Apply Now →
        </button>
        {onBookmark && (
          <button
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              color: isBookmarked ? 'var(--gd)' : 'var(--td)',
              padding: '2px 4px', borderRadius: 6,
              transition: 'color .2s, transform .2s',
              transform: isBookmarked ? 'scale(1.15)' : 'scale(1)',
            }}
            onClick={e => { e.stopPropagation(); onBookmark(job.id) }}
            title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  )
}
