import { useState, useRef, useEffect, useId } from 'react'
import csStyles from './CustomSelect.module.css'
import styles from './DialCodeSelect.module.css'

export default function DialCodeSelect({ value, onChange, codes, placeholder = 'Code', error }) {
  const [open, setOpen]       = useState(false)
  const [focused, setFocused] = useState(-1)
  const wrapRef  = useRef(null)
  const listRef  = useRef(null)
  const id       = useId()

  const selectedEntry = codes.find(d => d.code === value) || null

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open || focused < 0) return
    listRef.current?.children[focused]?.scrollIntoView({ block: 'nearest' })
  }, [focused, open])

  const toggle = () => {
    setOpen(v => {
      if (!v) setFocused(codes.findIndex(d => d.code === value))
      return !v
    })
  }

  const select = entry => {
    onChange(entry.code)
    setOpen(false)
    setFocused(-1)
  }

  const onKeyDown = e => {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setOpen(true)
      setFocused(Math.max(0, codes.findIndex(d => d.code === value)))
      return
    }
    if (!open) return
    if (e.key === 'Escape')    { e.preventDefault(); setOpen(false) }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(i => Math.min(i + 1, codes.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); select(codes[focused]) }
    if (e.key === 'Home')      { e.preventDefault(); setFocused(0) }
    if (e.key === 'End')       { e.preventDefault(); setFocused(codes.length - 1) }
  }

  return (
    <div ref={wrapRef} className={styles.wrap} onKeyDown={onKeyDown}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        className={`${csStyles.trigger} ${styles.trigger} ${open ? csStyles.triggerOpen : ''} ${error ? csStyles.triggerError : ''}`}
        onClick={toggle}>
        <span className={selectedEntry ? csStyles.value : csStyles.placeholder}>
          {selectedEntry ? `${selectedEntry.flag} ${selectedEntry.code}` : placeholder}
        </span>
        <span className={`${csStyles.arrow} ${open ? csStyles.arrowOpen : ''}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <div id={id} ref={listRef} role="listbox" className={`${csStyles.dropdown} ${styles.dropdown}`}>
          {codes.map((entry, i) => {
            const isSelected = entry.code === value
            const isFocused  = i === focused
            return (
              <div
                key={entry.country}
                role="option"
                aria-selected={isSelected}
                className={`${csStyles.option} ${isSelected ? csStyles.optionSelected : ''} ${isFocused ? csStyles.optionFocused : ''}`}
                onMouseEnter={() => setFocused(i)}
                onMouseDown={e => { e.preventDefault(); select(entry) }}>
                <span className={styles.optionLeft}>
                  <span className={styles.flag}>{entry.flag}</span>
                  <span className={styles.code}>{entry.code}</span>
                  <span className={styles.country}>{entry.country}</span>
                </span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0 }}>
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
