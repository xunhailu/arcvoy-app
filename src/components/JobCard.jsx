import { motion } from 'framer-motion'

export default function JobCard({ job, onClick, onApply, delay = 0, isBookmarked = false, onBookmark }) {
  return (
    <motion.div
      className="job-row"
      onClick={e => { if (window.getSelection()?.toString()) return; onClick(e) }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0, 0, 1] }}
      style={{ cursor: 'pointer' }}
    >
      <div className="job-row-info">
        <span className="job-dept">{job.dept}</span>
        <span className="job-row-title">{job.title}</span>
      </div>

      <div className="job-row-meta">
        {job.locations?.[0] && <span className="job-row-loc">{job.locations[0]}</span>}
        <span className="job-row-type">{job.type}</span>
      </div>

      <div className="job-row-actions">
        <span className="job-row-salary">{job.salary}</span>
        <button
          className="job-row-apply"
          onClick={e => { e.stopPropagation(); onApply ? onApply(job) : onClick(e) }}
        >
          Apply <span className="arrow">→</span>
        </button>
        {onBookmark && (
          <motion.button
            className={`job-bookmark ${isBookmarked ? 'saved' : ''}`}
            whileTap={{ scale: 0.82 }}
            onClick={e => { e.stopPropagation(); onBookmark(job.id) }}
            title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
