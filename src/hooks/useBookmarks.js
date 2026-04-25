import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'arcvoy_saved_jobs'

function lsGet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')) }
  catch { return new Set() }
}
function lsSet(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]))
}

export function useBookmarks() {
  const [saved, setSaved] = useState(lsGet)
  const userRef = useRef(null)

  /* load bookmarks from Supabase for a logged-in user */
  const loadFromDb = useCallback(async (userId) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('job_id')
      .eq('user_id', userId)
    if (data) {
      const next = new Set(data.map(r => r.job_id))
      setSaved(next)
      lsSet(next)
    }
  }, [])

  /* subscribe to auth state; sync on login */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      userRef.current = user
      if (user) loadFromDb(user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      userRef.current = user
      if (user) {
        loadFromDb(user.id)
      } else {
        setSaved(lsGet())
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadFromDb])

  const toggle = useCallback(async (id) => {
    const user = userRef.current

    setSaved(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      if (!user) lsSet(next)
      return next
    })

    if (user) {
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', id)
        .maybeSingle()

      if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id)
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, job_id: id })
      }
    }
  }, [])

  const isBookmarked = useCallback((id) => saved.has(id), [saved])

  return { saved, toggle, isBookmarked }
}
