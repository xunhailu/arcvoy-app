import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.orb} />

      <motion.div className={styles.inner}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0, 0, 1] }}>

        <div className={styles.brandRow}>
          <BrandMark size={13} />
          <span className={styles.brand}>Arcvoy</span>
        </div>

        <div className={styles.code}>404</div>

        <h1 className={styles.title}>
          Lost in the <em>async</em>
        </h1>

        <p className={styles.desc}>
          This page doesn't exist — but a great opportunity does. Head back and find yours.
        </p>

        <div className={styles.btns}>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
          <button className="btn-ghost" onClick={() => navigate('/jobs')}>View Open Roles</button>
        </div>
      </motion.div>
    </div>
  )
}
