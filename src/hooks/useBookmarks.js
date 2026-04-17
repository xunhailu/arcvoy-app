import { useState, useEffect, useCallback } from 'react'

const KEY = 'arcvoy_saved_jobs'

export function useBookmarks() {
  const [saved, setSaved] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...saved]))
  }, [saved])

  const toggle = useCallback(id => {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const isBookmarked = useCallback(id => saved.has(id), [saved])

  return { saved, toggle, isBookmarked }
}
