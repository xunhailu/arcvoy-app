import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    let raf
    let cx = -400, cy = -400
    let tx = -400, ty = -400

    const onMove = e => { tx = e.clientX; ty = e.clientY }
    window.addEventListener('mousemove', onMove, { passive: true })

    const loop = () => {
      cx += (tx - cx) * 0.07
      cy += (ty - cy) * 0.07
      if (ref.current) {
        ref.current.style.transform = `translate(${cx - 350}px, ${cy - 350}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} style={{
      position: 'fixed',
      top: 0, left: 0,
      width: 700, height: 700,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(204,102,51,0.06) 0%, transparent 60%)',
      pointerEvents: 'none',
      zIndex: 1,
      willChange: 'transform',
    }} />
  )
}
