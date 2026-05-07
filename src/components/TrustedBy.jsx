import styles from './TrustedBy.module.css'
import { siGoogle, siMeta, siSony } from 'simple-icons'

/* ─── Adobe: canonical red "A" mark + wordmark ─── */
const LogoAdobe = () => (
  <svg viewBox="0 0 62 22" height="30" fill="none" aria-label="Adobe">
    {/* Red square */}
    <rect width="22" height="22" rx="2" fill="#FA0F00"/>
    {/* White A mark — the two outer triangles */}
    <path d="M11 4L18.5 18H3.5L11 4z" fill="#fff"/>
    <text x="28" y="16.5" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="800" fontSize="13" fill="currentColor">Adobe</text>
  </svg>
)

/* ─── Amazon: wordmark + orange smile ─── */
const LogoAmazon = () => (
  <svg viewBox="0 0 82 30" height="30" fill="none" aria-label="Amazon">
    <text x="0" y="18" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="18" fill="currentColor">amazon</text>
    <path d="M8 25C23 30.5 50 30.5 66 25" stroke="#FF9900" strokeWidth="2.6" strokeLinecap="round"/>
    <path d="M63 22L67 25L63.5 28.5" stroke="#FF9900" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ─── BBC: three filled blocks ─── */
const LogoBBC = () => (
  <svg viewBox="0 0 82 26" height="30" aria-label="BBC">
    <rect x="0"  width="24" height="26" fill="currentColor"/>
    <text x="12"  y="20" textAnchor="middle" fontFamily="Georgia,Times,'Times New Roman',serif" fontWeight="900" fontSize="17" fill="var(--bg)">B</text>
    <rect x="29" width="24" height="26" fill="currentColor"/>
    <text x="41"  y="20" textAnchor="middle" fontFamily="Georgia,Times,'Times New Roman',serif" fontWeight="900" fontSize="17" fill="var(--bg)">B</text>
    <rect x="58" width="24" height="26" fill="currentColor"/>
    <text x="70"  y="20" textAnchor="middle" fontFamily="Georgia,Times,'Times New Roman',serif" fontWeight="900" fontSize="17" fill="var(--bg)">C</text>
  </svg>
)

/* ─── Google: coloured full wordmark ─── */
const LogoGoogle = () => (
  <svg viewBox="0 0 88 30" height="30" aria-label="Google">
    <text y="26" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="26">
      <tspan fill="#4285F4">G</tspan>
      <tspan fill="#EA4335">o</tspan>
      <tspan fill="#FBBC05">o</tspan>
      <tspan fill="#4285F4">g</tspan>
      <tspan fill="#34A853">l</tspan>
      <tspan fill="#EA4335">e</tspan>
    </text>
  </svg>
)

/* ─── Meta: real simple-icons path + wordmark ─── */
const LogoMeta = () => (
  <svg viewBox="0 0 72 24" height="28" fill="none" aria-label="Meta">
    <g transform="scale(0.85)">
      <path d={siMeta.path} fill={`#${siMeta.hex}`}/>
    </g>
    <text x="26" y="19" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="17" fill="currentColor">Meta</text>
  </svg>
)

/* ─── Microsoft: four coloured squares + wordmark ─── */
const LogoMicrosoft = () => (
  <svg viewBox="0 0 114 22" height="26" fill="none" aria-label="Microsoft">
    <rect x="0"  y="0"  width="10" height="10" fill="#F25022"/>
    <rect x="12" y="0"  width="10" height="10" fill="#7FBA00"/>
    <rect x="0"  y="12" width="10" height="10" fill="#00A4EF"/>
    <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
    <text x="30" y="17.5" fontFamily="'Segoe UI',Arial,sans-serif" fontWeight="400" fontSize="14.5" fill="currentColor">Microsoft</text>
  </svg>
)

/* ─── OpenAI: 6-petal flower (rounded-rect petals) + wordmark ─── */
const LogoOpenAI = () => (
  <svg viewBox="0 0 82 24" height="28" fill="none" aria-label="OpenAI">
    <g transform="translate(12,12)">
      {[0,60,120,180,240,300].map(a => (
        <path
          key={a}
          d="M -1.3,-2.8 L -1.3,-7.8 Q -1.3,-9.2 0,-9.2 Q 1.3,-9.2 1.3,-7.8 L 1.3,-2.8 Q 1.3,-1.4 0,-1.4 Q -1.3,-1.4 -1.3,-2.8 Z"
          transform={`rotate(${a})`}
          fill="currentColor"
        />
      ))}
    </g>
    <text x="30" y="18" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="14.5" fill="currentColor">OpenAI</text>
  </svg>
)

/* ─── Publicis Groupe: gold sunburst crest + wordmark ─── */
const LogoPublicis = () => (
  <svg viewBox="0 0 148 40" height="40" fill="none" aria-label="Publicis Groupe">
    <circle cx="20" cy="20" r="17" stroke="#B8922A" strokeWidth="1.4"/>
    <circle cx="20" cy="20" r="11" stroke="#B8922A" strokeWidth="1"/>
    <circle cx="20" cy="20" r="3.5" fill="#B8922A"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
      const r = a * Math.PI / 180
      const x1 = 20 + 12.5 * Math.cos(r), y1 = 20 + 12.5 * Math.sin(r)
      const x2 = 20 + 15.5 * Math.cos(r), y2 = 20 + 15.5 * Math.sin(r)
      return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B8922A" strokeWidth="1.2" strokeLinecap="round"/>
    })}
    <text x="44" y="24" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="13.5" fill="currentColor">Publicis Groupe</text>
  </svg>
)

/* ─── Sony: real simple-icons SONY paths ─── */
const LogoSony = () => (
  <svg viewBox="0 0 24 24" height="26" aria-label="Sony">
    <path d={siSony.path} fill="currentColor"/>
  </svg>
)

/* ─── truepic: three concentric rings + wordmark ─── */
const LogoTruepic = () => (
  <svg viewBox="0 0 88 26" height="28" fill="none" aria-label="truepic">
    <circle cx="13" cy="13" r="11.5" stroke="#1E6FCC" strokeWidth="1.6"/>
    <circle cx="13" cy="13" r="7"    stroke="#1E6FCC" strokeWidth="1.6"/>
    <circle cx="13" cy="13" r="2.5"  fill="#1E6FCC"/>
    <text x="30" y="19" fontFamily="Arial,sans-serif" fontWeight="600" fontSize="14.5" fill="currentColor">truepic</text>
  </svg>
)

const ROW1 = [
  { id: 'adobe',     El: LogoAdobe },
  { id: 'amazon',    El: LogoAmazon },
  { id: 'bbc',       El: LogoBBC },
  { id: 'google',    El: LogoGoogle },
  { id: 'meta',      El: LogoMeta },
  { id: 'microsoft', El: LogoMicrosoft },
]

const ROW2 = [
  { id: 'openai',   El: LogoOpenAI },
  { id: 'publicis', El: LogoPublicis },
  { id: 'sony',     El: LogoSony },
  { id: 'truepic',  El: LogoTruepic },
]

export default function TrustedBy() {
  return (
    <section className={styles.section}>
      <p className={styles.heading}>Meet the Steering Committee members</p>
      <div className={styles.row}>
        {ROW1.map(({ id, El }) => (
          <div key={id} className={styles.logo}><El /></div>
        ))}
      </div>
      <div className={styles.row}>
        {ROW2.map(({ id, El }) => (
          <div key={id} className={styles.logo}><El /></div>
        ))}
      </div>
    </section>
  )
}
