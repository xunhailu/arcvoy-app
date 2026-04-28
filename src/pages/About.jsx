import { motion } from 'framer-motion'
import { PILLARS, ABOUT_TEXT } from '../data'
import styles from './About.module.css'

const TEAM_VALUES = [
  { num: '01', title: 'People before process', text: 'Every model improves because a person shaped it. We keep those people visible, valued, and well compensated.' },
  { num: '02', title: 'Built for the world', text: 'Our contributor network spans 40+ countries. That geographic and cultural range is what makes the work meaningful.' },
  { num: '03', title: 'Straight communication', text: 'Every applicant hears back from us — accepted or not. Honest communication is not optional for us.' },
  { num: '04', title: 'Real ownership', text: 'We hire people who take initiative. High autonomy paired with real accountability and fair pay.' },
]

const MILESTONES = [
  { year: '2024', event: 'Arcvoy founded with a clear mission: put human intelligence at the centre of AI development.' },
  { year: '2025', event: 'Expanded into 40+ countries. Launched our contributor workflow platform and signed our first enterprise AI training partnerships.' },
  { year: '2026', event: 'Partnered with Fortune 500 AI teams. Network surpassed 1,000 active specialists. Still growing. Still hiring.' },
]

export default function About({ onNavigate }) {
  return (
    <div className={styles.page}>

      {/* hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div className="label" style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Who We Are
          </motion.div>
          <motion.h1 className={styles.heroTitle}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            Building the human<br />layer of <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>AI</em>
          </motion.h1>
          <motion.p className={styles.heroSub}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            Arcvoy recruits, manages, and supports the global contributor networks that keep AI systems honest, accurate, and improving.
          </motion.p>
        </div>
      </section>

      {/* by the numbers */}
      <section className={styles.statsStrip}>
        {[
          { num: '1,000+', label: 'Active Contributors' },
          { num: '40+',    label: 'Countries' },
          { num: '100%',   label: 'Applications Reviewed' },
          { num: '2024',   label: 'Founded' },
        ].map((s, i) => (
          <motion.div key={s.label} className={styles.stripCard}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.09 }}>
            <span className={styles.stripNum}>{s.num}</span>
            <span className={styles.stripLabel}>{s.label}</span>
          </motion.div>
        ))}
      </section>

      {/* mission body */}
      <section className={styles.mission}>
        <motion.div className={styles.missionLeft}
          initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="label" style={{ marginBottom: 16 }}>Our Mission</div>
          <h2 className={styles.secH}>
            Reliable human<br />feedback at <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>every stage</em>
          </h2>
        </motion.div>
        <motion.div className={styles.missionRight}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
          {ABOUT_TEXT.map((p, i) => <p key={i} className={styles.bodyText}>{p}</p>)}
        </motion.div>
      </section>

      {/* values */}
      <section className={styles.values}>
        <motion.div className={styles.valuesHead}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="label" style={{ justifyContent: 'center', marginBottom: 12 }}>What We Stand For</div>
          <h2 className={styles.secH} style={{ textAlign: 'center' }}>
            Values that <em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>guide us</em>
          </h2>
        </motion.div>
        <div className={styles.valuesGrid}>
          {TEAM_VALUES.map((v, i) => (
            <motion.div key={v.num} className={styles.valueCard}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <span className={styles.valNum}>{v.num}</span>
              <h3 className={styles.valTitle}>{v.title}</h3>
              <p className={styles.valText}>{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* timeline */}
      <section className={styles.timeline}>
        <motion.div className={styles.timelineHead}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="label" style={{ marginBottom: 12 }}>Our Journey</div>
          <h2 className={styles.secH}>How we got here</h2>
        </motion.div>
        <div className={styles.timelineList}>
          <div className={styles.timelineLine} />
          {MILESTONES.map((m, i) => (
            <motion.div key={m.year} className={styles.milestone}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <div className={styles.mYear}>{m.year}</div>
              <div className={styles.mDot} />
              <p className={styles.mEvent}>{m.event}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <div className="label" style={{ justifyContent: 'center', marginBottom: 20 }}>Join the Team</div>
          <h2 className={styles.ctaTitle}>
            Ready to help shape<br /><em style={{ color: 'var(--gd)', fontStyle: 'italic' }}>the future of AI?</em>
          </h2>
          <p className={styles.ctaDesc}>Browse our open roles. Every application gets a personal review and a real response.</p>
          <div className={styles.ctaBtns}>
            <button className="btn-primary" onClick={() => onNavigate('jobs')}>Browse Open Roles →</button>
            <button className="btn-ghost" onClick={() => onNavigate('home')}>Back to Home</button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
