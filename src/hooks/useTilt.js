import { useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * useTilt — smooth 3D perspective tilt driven by mouse position.
 * Also drives a [data-shine] child element for a dynamic highlight.
 * Integrates with framer-motion so it composes with animate/initial/exit.
 *
 * Usage:
 *   const tilt = useTilt(8)
 *   <motion.div style={tilt.style} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
 *     <div data-shine ... />  ← optional shine overlay
 *   </motion.div>
 */
export function useTilt(maxDeg = 8) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const sx = useSpring(mx, { stiffness: 200, damping: 24, mass: 0.5 })
  const sy = useSpring(my, { stiffness: 200, damping: 24, mass: 0.5 })

  const rotateX = useTransform(sy, [-0.5, 0.5], [maxDeg, -maxDeg])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-maxDeg, maxDeg])

  const onMouseMove = e => {
    const r = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width  - 0.5
    const ny = (e.clientY - r.top)  / r.height - 0.5
    mx.set(nx)
    my.set(ny)

    // drive the shine overlay if present
    const shine = e.currentTarget.querySelector('[data-shine]')
    if (shine) {
      const px = ((e.clientX - r.left) / r.width)  * 100
      const py = ((e.clientY - r.top)  / r.height) * 100
      shine.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.09) 0%, transparent 62%)`
      shine.style.opacity = '1'
    }
  }

  const onMouseLeave = e => {
    mx.set(0)
    my.set(0)
    const shine = e.currentTarget.querySelector('[data-shine]')
    if (shine) shine.style.opacity = '0'
  }

  return {
    style: { rotateX, rotateY, transformStyle: 'preserve-3d' },
    onMouseMove,
    onMouseLeave,
  }
}
