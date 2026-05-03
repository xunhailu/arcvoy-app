import { useEffect, useRef } from 'react'

/**
 * Particles — lightweight canvas particle system with connecting lines.
 * Brand-coloured dots that drift slowly and connect when close.
 */
export default function Particles({ count = 52, color = '217, 119, 87' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    const ro = new ResizeObserver(() => {
      // reset scale before resizing to avoid stacking scale transforms
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      resize()
    })
    ro.observe(canvas)
    resize()

    // logical dimensions (pre-DPR)
    const lw = () => canvas.offsetWidth
    const lh = () => canvas.offsetHeight

    const pts = Array.from({ length: count }, () => ({
      x:  Math.random() * lw(),
      y:  Math.random() * lh(),
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r:  Math.random() * 1.6 + 0.5,
      a:  Math.random() * 0.32 + 0.08,
    }))

    const draw = () => {
      const W = lw(), H = lh()
      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.a})`
        ctx.fill()
      }

      const LINK = 115
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < LINK) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(${color},${(1 - d / LINK) * 0.09})`
            ctx.lineWidth   = 0.7
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [count, color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        opacity: 0.85,
      }}
    />
  )
}
