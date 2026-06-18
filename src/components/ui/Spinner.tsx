import styles from './Spinner.module.css'

/** Centered analyzing state: gold spinner + title + subtitle. */
export default function Spinner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}
