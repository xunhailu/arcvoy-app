import { useState, useRef, useEffect, useId } from 'react'
import styles from './CustomSelect.module.css'

export default function CustomSelect({ value, onChange, options, placeholder = 'Select…', error }) {
  const [open, setOpen]       = useState(false)
  const [focused, setFocused] = useState(-1)
  const wrapRef  = useRef(null)
  const listRef  = useRef(null)
  const id       = useId()

  /* close on outside click */
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* scroll focused option into view */
  useEffect(() => {
    if (!open || focused < 0) return
    const el = listRef.current?.children[focused]
    el?.scrollIntoView({ block: 'nearest' })
  }, [focused, open])

  const toggle = () => {
    setOpen(v => {
      if (!v) setFocused(options.indexOf(value))
      return !v
    })
  }

  const select = (opt) => {
    onChange(opt)
    setOpen(false)
    setFocused(-1)
  }

  const onKeyDown = e => {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault(); setOpen(true); setFocused(Math.max(0, options.indexOf(value)))
      return
    }
    if (!open) return
    if (e.key === 'Escape')     { e.preventDefault(); setOpen(false) }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setFocused(i => Math.min(i + 1, options.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setFocused(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); select(options[focused]) }
    if (e.key === 'Home')       { e.preventDefault(); setFocused(0) }
    if (e.key === 'End')        { e.preventDefault(); setFocused(options.length - 1) }
  }

  return (
    <div ref={wrapRef} className={styles.wrap} onKeyDown={onKeyDown}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${error ? styles.triggerError : ''}`}
        onClick={toggle}>
        <span className={value ? styles.value : styles.placeholder}>
          {value || placeholder}
        </span>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <div
          id={id}
          ref={listRef}
          role="listbox"
          className={styles.dropdown}>
          {options.map((opt, i) => {
            const isSelected = opt === value
            const isFocused  = i === focused
            return (
              <div
                key={opt}
                role="option"
                aria-selected={isSelected}
                className={`${styles.option}
                  ${isSelected ? styles.optionSelected : ''}
                  ${isFocused  ? styles.optionFocused  : ''}`}
                onMouseEnter={() => setFocused(i)}
                onMouseDown={e => { e.preventDefault(); select(opt) }}>
                <span>{opt}</span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
