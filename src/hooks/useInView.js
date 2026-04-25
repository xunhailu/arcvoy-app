import { useEffect, useRef, useState } from 'react'

/**
 * Reusable IntersectionObserver hook.
 * Returns [ref, inView]. Fires once and unobserves — no repeat triggers.
 */
export function useInView(threshold = 0.15) {
  threshold = Math.min(1, Math.max(0, threshold))
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, inView]
}
