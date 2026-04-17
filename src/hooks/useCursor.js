import { useEffect, useRef } from 'react'

export function useCursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  const pos     = useRef({ mx: 0, my: 0, rx: 0, ry: 0 })
  const raf     = useRef(null)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = e => {
      pos.current.mx = e.clientX
      pos.current.my = e.clientY
      dot.style.left = e.clientX + 'px'
      dot.style.top  = e.clientY + 'px'
    }

    const lerp = () => {
      const p = pos.current
      p.rx += (p.mx - p.rx) * 0.10
      p.ry += (p.my - p.ry) * 0.10
      ring.style.left = p.rx + 'px'
      ring.style.top  = p.ry + 'px'
      raf.current = requestAnimationFrame(lerp)
    }

    const onEnter = () => ring.classList.add('hovering')
    const onLeave = () => ring.classList.remove('hovering')

    document.addEventListener('mousemove', onMove)
    raf.current = requestAnimationFrame(lerp)

    const targets = document.querySelectorAll('button, a, input, select, .job-card')
    targets.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return { dotRef, ringRef }
}
