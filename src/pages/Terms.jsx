import { motion } from 'framer-motion'
import styles from './Legal.module.css'

const SECTIONS = [
  {
    title: 'Agreement to These Terms',
    body: `These Terms of Use ("Terms") constitute a legally binding agreement between you and Arcvoy ("we", "us", or "our") governing your access to and use of arcvoy.com and all associated services (collectively, the "Platform"). By visiting, registering, or submitting an application through the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms in full. If you do not agree, you must discontinue use immediately. We reserve the right to update these Terms at any time — continued use after any revision constitutes your acceptance of the updated version.`,
  },
  {
    title: 'Who We Are & What We Do',
    body: `Arcvoy is a specialist AI talent platform that connects skilled professionals with companies building at the frontier of artificial intelligence. We facilitate the discovery of open roles, the submission of applications, and the management of candidate pipelines. Arcvoy acts as an intermediary between candidates and hiring organisations — we do not guarantee employment, placement, or any specific outcome from your use of the Platform.`,
  },
  {
    title: 'Eligibility & Account Responsibility',
    body: `You must be at least 18 years of age to use the Platform. By creating an account, you confirm that all information you provide is accurate, current, and complete. You are solely responsible for maintaining the security and confidentiality of your login credentials and for all activity conducted under your account. You must notify us immediately at support@arcvoy.com if you suspect any unauthorised access. Arcvoy will not be liable for any loss or damage resulting from your failure to protect your account.`,
  },
  {
    title: 'Submitting an Application',
    body: `When you submit a job application through Arcvoy, you certify that all information provided — including your personal details, work history, qualifications, and uploaded documents — is truthful and accurate. You grant Arcvoy a non-exclusive, worldwide licence to store, process, and share your application data with the relevant hiring organisation for the sole purpose of evaluating your candidacy. Deliberately submitting false, misleading, or fraudulent information will result in immediate disqualification, removal from the Platform, and may be referred to appropriate authorities where applicable.`,
  },
  {
    title: 'Acceptable Use',
    body: `You agree to use the Platform only for its intended purpose — exploring career opportunities and managing your professional applications. You must not: use the Platform for any unlawful purpose or in violation of any applicable regulations; attempt to gain unauthorised access to any part of our systems; scrape, harvest, or extract data from the Platform by automated means; impersonate any individual or organisation; or engage in any conduct that could damage, overload, or impair the integrity of our infrastructure. Arcvoy reserves the right to restrict or terminate access for any violation of this section without prior notice.`,
  },
  {
    title: 'Intellectual Property',
    body: `All content on the Platform — including but not limited to design, layout, typography, logos, written copy, illustrations, software, and data structures — is the exclusive property of Arcvoy or its licensors and is protected under international intellectual property law. Nothing in these Terms grants you any right, title, or interest in our intellectual property. You may not copy, reproduce, modify, adapt, distribute, or create derivative works from any part of the Platform without our explicit prior written consent.`,
  },
  {
    title: 'Privacy & Your Data',
    body: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We take data protection seriously and handle your personal information in accordance with applicable data protection legislation. By using the Platform, you consent to the collection, storage, and processing of your data as described in our Privacy Policy. You may request deletion of your data at any time by contacting support@arcvoy.com.`,
  },
  {
    title: 'Disclaimer of Warranties',
    body: `The Platform is provided on an "as is" and "as available" basis without warranties of any kind, express or implied. Arcvoy does not warrant that the Platform will be continuously available, error-free, secure, or free from viruses or harmful components. We make no representations regarding the accuracy or completeness of any content on the Platform. Your use of the Platform is entirely at your own risk. Role listings are provided in good faith but Arcvoy does not guarantee that any position remains open at the time of your application.`,
  },
  {
    title: 'Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, Arcvoy, its directors, employees, contractors, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform — including but not limited to loss of income, loss of data, reputational harm, or missed professional opportunities — even if we have been advised of the possibility of such damages. Our total aggregate liability to you for any claim shall not exceed the amount you have paid us, if any, in the twelve months preceding the claim.`,
  },
  {
    title: 'Third-Party Services & Links',
    body: `The Platform may contain links to third-party websites, tools, or services not owned or controlled by Arcvoy. These are provided solely for your convenience. We have no control over, and accept no responsibility for, the content, privacy practices, or terms of any third-party service. Accessing any third-party link is entirely at your own risk and subject to the terms of that third party.`,
  },
  {
    title: 'Suspension & Termination',
    body: `Arcvoy reserves the right, at its sole discretion, to suspend, restrict, or permanently terminate your access to the Platform at any time and without prior notice, for any conduct that we determine — acting reasonably — to be in violation of these Terms, harmful to other users or to Arcvoy, or contrary to applicable law. Upon termination, your right to use the Platform ceases immediately. Provisions of these Terms that by their nature should survive termination shall continue to apply.`,
  },
  {
    title: 'Governing Law & Disputes',
    body: `These Terms shall be governed by and construed in accordance with applicable law. In the event of any dispute arising from or in connection with these Terms or your use of the Platform, both parties agree to first attempt resolution through good-faith negotiation. If a resolution cannot be reached within 30 days, the dispute may be escalated to the appropriate legal forum. For any legal correspondence, contact us at support@arcvoy.com.`,
  },
]

export default function Terms() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <motion.div className="label" style={{ marginBottom: 14 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Legal
        </motion.div>
        <motion.h1 className={styles.title}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Terms of Use
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
