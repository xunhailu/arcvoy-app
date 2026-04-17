import styles from './Sponsors.module.css'

const LOGOS = [
  { name: 'Shopify',    src: 'https://cdn.simpleicons.org/shopify/96bf48' },
  { name: 'Figma',      src: 'https://cdn.simpleicons.org/figma/F24E1E' },
  { name: 'Stripe',     src: 'https://cdn.simpleicons.org/stripe/635BFF' },
  { name: 'Databricks', src: 'https://cdn.simpleicons.org/databricks/FF3621' },
  { name: 'Zapier',     src: 'https://cdn.simpleicons.org/zapier/FF4A00' },
  { name: 'Notion',     src: 'https://cdn.simpleicons.org/notion/999999' },
  { name: 'Spotify',    src: 'https://cdn.simpleicons.org/spotify/1DB954' },
  { name: 'Intercom',   src: 'https://cdn.simpleicons.org/intercom/1F8DED' },
]

/* duplicate for seamless infinite loop */
const TRACK = [...LOGOS, ...LOGOS]

export default function Sponsors() {
  return (
    <section className={styles.section}>
      <p className={styles.label}>Trusted by teams who build with the best</p>
      <div className={styles.wrapper}>
        <div className={styles.track}>
          {TRACK.map(({ name, src }, i) => (
            <div key={`${name}-${i}`} className={styles.item}>
              <img src={src} alt={name} className={styles.logo} draggable={false} />
              <span className={styles.logoName}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
