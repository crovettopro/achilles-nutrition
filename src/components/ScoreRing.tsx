import { RING_CIRCUMFERENCE, RING_RADIUS, scoreDashoffset } from '../lib/score'
import styles from './ScoreRing.module.css'

/** The Achilles Score ring — gold progress arc over a faint track. */
export default function ScoreRing({ score, hasData = true }: { score: number; hasData?: boolean }) {
  return (
    <div className={styles.wrap}>
      <svg width="180" height="180" viewBox="0 0 180 180" className={styles.svg}>
        <circle
          cx="90"
          cy="90"
          r={RING_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="5"
        />
        {hasData && (
          <circle
            cx="90"
            cy="90"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE.toFixed(1)}
            strokeDashoffset={scoreDashoffset(score).toFixed(1)}
          />
        )}
      </svg>
      <div className={styles.center}>
        <div className={styles.number}>{hasData ? score : '—'}</div>
        <div className={styles.label}>Aquiles Score</div>
      </div>
    </div>
  )
}
