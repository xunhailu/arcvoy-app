import { motion } from 'framer-motion'
import styles from './Legal.module.css'

const SECTIONS = [
  {
    title: 'Who We Are',
    body: `Arcvoy is a specialist AI talent platform connecting skilled professionals with companies building at the frontier of artificial intelligence. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform. Our designated contact for all data and privacy matters is support@arcvoy.com. By using the Arcvoy platform, you agree to the practices described in this policy.`,
  },
  {
    title: 'What Data We Collect',
    body: `When you submit a job application, we collect your full name, email address, residential address, city, state, country, postcode, LinkedIn profile URL, preferred languages, and your CV or resume file. When you create a candidate account, we collect your email address and a securely hashed password. When you browse our platform, we may also collect standard technical data including your IP address, browser type, device information, and pages visited. This technical data is used solely for platform security and performance purposes.`,
  },
  {
    title: 'Why We Collect It',
    body: `We collect your personal data for specific and legitimate purposes only. We use it to process and evaluate your job applications, to communicate with you regarding your application status and any updates, to operate and maintain your candidate account, and to improve the overall experience and functionality of our platform. We do not sell, rent, or trade your personal data to any third party under any circumstances.`,
  },
  {
    title: 'How We Store and Protect It',
    body: `Your data is stored on secure Supabase infrastructure hosted on Amazon Web Services. CV and resume files are stored in a private, restricted storage environment that is not publicly accessible. Access to your full application data is limited exclusively to authenticated Arcvoy administrators. Your candidate account is protected by Row Level Security, meaning you can only ever view your own application data and no one else's. All data in transit is encrypted using industry standard TLS protocols.`,
  },
  {
    title: 'How Long We Keep It',
    body: `We retain application data for up to 24 months following the date of submission. If your application leads to an active engagement or placement, we may retain the relevant records for the duration of that engagement and for a reasonable period thereafter for administrative purposes. You may request deletion of your personal data at any time by contacting us at support@arcvoy.com. We will action verified deletion requests within 30 days.`,
  },
  {
    title: 'Your Rights',
    body: `Depending on the laws applicable in your jurisdiction, you may have the right to access the personal data we hold about you, to request correction of any inaccurate information, to request deletion of your data, to object to or request restrictions on how we process your data, and to receive a portable copy of your data. To exercise any of these rights, please contact us at support@arcvoy.com. We will respond to all verified requests within 30 days. We will never charge a fee for exercising your rights.`,
  },
  {
    title: 'Cookies',
    body: `We use only essential cookies necessary for the platform to function. These include a session cookie to keep you logged in and a preference cookie to remember your chosen display theme. We do not use advertising cookies, tracking cookies, or any third party analytics cookies that monitor your behaviour across other websites. You may disable cookies through your browser settings, though doing so may affect the functionality of certain features on the platform.`,
  },
  {
    title: 'Third Party Services',
    body: `Arcvoy uses a small number of trusted third party services to operate the platform. These include Supabase for database management and authentication, Resend for transactional email delivery, and optionally Google or LinkedIn for account sign in. Each of these providers operates under their own privacy policies and data processing agreements. We select only providers that meet high standards of data security and compliance. We do not share your data with any third party beyond what is necessary to operate these core services.`,
  },
  {
    title: 'Changes to This Policy',
    body: `We may update this Privacy Policy periodically to reflect changes in our practices or applicable regulations. When we make material changes, we will update the date shown at the top of this page. We encourage you to review this policy regularly. Your continued use of the platform after any update constitutes your acceptance of the revised policy.`,
  },
  {
    title: 'Contact Us',
    body: `If you have any questions, concerns, or requests relating to this Privacy Policy or the way we handle your personal data, please contact us at support@arcvoy.com. We take all privacy enquiries seriously and aim to respond to every message within 48 hours.`,
  },
]

export default function PrivacyPolicy() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <motion.div className="label" style={{ marginBottom: 14 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Legal
        </motion.div>
        <motion.h1 className={styles.title}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Privacy Policy
        </motion.h1>
        <motion.p className={styles.sub}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          Last updated: April 2026
        </motion.p>
      </div>

      <div className={styles.body}>
        {SECTIONS.map((s, i) => (
          <motion.div key={s.title} className={styles.section}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.04 }}>
            <h2 className={styles.sectionTitle}>{s.title}</h2>
            <p className={styles.sectionBody}>{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
