import type { DayTone } from '../lib/metrics'
import styles from './DailyTargets.module.css'

/**
 * Daily protein / calorie accumulation vs the targets, with a status line.
 * Shared by the Home dashboard and the Scan result ("con esta comida").
 */
export default function DailyTargets({
  heading,
  protein,
  proteinTarget,
  kcal,
  kcalTarget,
  status,
  penalty = 0,
}: {
  heading: string
  protein: number
  proteinTarget: number
  kcal: number
  kcalTarget: number
  status: { label: string; tone: DayTone }
  /** Calories deducted from today's target because of yesterday's alcohol. */
  penalty?: number
}) {
  return (
    <section className={styles.day}>
      <div className={styles.head}>{heading}</div>
      <div className={styles.grid}>
        <Stat label="Proteína" value={`${protein}g`} target={`${proteinTarget}g`} pct={proteinTarget ? protein / proteinTarget : 0} />
        <Stat
          label="Calorías"
          value={kcal.toLocaleString('es-ES')}
          target={kcalTarget.toLocaleString('es-ES')}
          pct={kcalTarget ? kcal / kcalTarget : 0}
        />
      </div>
      {penalty > 0 && (
        <div className={styles.penalty}>
          Objetivo ajustado −{penalty.toLocaleString('es-ES')} kcal por el alcohol de ayer.
        </div>
      )}
      <div className={`${styles.status} ${styles[status.tone]}`}>
        <span className={styles.dot} />
        {status.label}
      </div>
    </section>
  )
}

function Stat({ label, value, target, pct }: { label: string; value: string; target: string; pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct))
  const over = pct > 1.05
  return (
    <div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>
        {value} <span className={styles.statTarget}>/ {target}</span>
      </div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${clamped * 100}%`, background: over ? '#d9836b' : 'var(--gold)' }} />
      </div>
    </div>
  )
}
