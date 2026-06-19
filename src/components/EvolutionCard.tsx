import Sparkline from './Sparkline'
import { motivationalLine, shortDate, type Evolution } from '../lib/metrics'
import type { Goal } from '../types'
import styles from './EvolutionCard.module.css'

const num = (n: number) => n.toLocaleString('es-ES')

/**
 * The fine evolution chart shown on the athlete's Progress screen and on the
 * coach's athlete detail. Weight is the primary line; waist is a mini line.
 * Renders nothing until there are 2+ check-ins.
 */
export default function EvolutionCard({ evo, goal }: { evo: Evolution; goal: Goal }) {
  const metric = evo.weight
  if (!metric) return null

  const waist = evo.waist
  const goalDown = goal === 'fat' // fat loss → going down is good
  const good = goalDown ? metric.pctChange < 0 : metric.pctChange > 0
  const arrow = metric.pctChange < 0 ? '↓' : metric.pctChange > 0 ? '↑' : '·'

  const fmtAbs = (v: number, unit: string) =>
    `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v))} ${unit}`

  return (
    <section className={styles.evo}>
      <div className={styles.evoHead}>
        <span className={styles.evoEyebrow}>Evolución · Peso</span>
        <span className={styles.evoRange}>
          {shortDate(metric.firstDate)} → {shortDate(metric.lastDate)}
        </span>
      </div>

      <div className={styles.evoMain}>
        <div className={styles.evoValue}>
          {num(metric.last)}
          <span className={styles.evoUnit}>kg</span>
        </div>
        <div className={`${styles.evoChange} ${good ? styles.good : styles.bad}`}>
          {arrow} {Math.abs(metric.pctChange)}%
        </div>
      </div>

      <Sparkline values={metric.series.map((p) => p.value)} />

      <div className={styles.evoMeta}>
        {evo.count} mediciones · {fmtAbs(metric.absChange, 'kg')} en {evo.weeks}{' '}
        {evo.weeks === 1 ? 'semana' : 'semanas'}
      </div>

      {waist && (
        <div className={styles.evoWaist}>
          <div className={styles.evoWaistInfo}>
            <span className={styles.evoWaistLabel}>Cintura</span>
            <span className={styles.evoWaistValue}>{num(waist.last)} cm</span>
          </div>
          <div className={styles.evoWaistSpark}>
            <Sparkline values={waist.series.map((p) => p.value)} height={34} color="var(--text-2)" />
          </div>
          <span
            className={`${styles.evoWaistChange} ${(goalDown ? waist.pctChange < 0 : waist.pctChange > 0) ? styles.good : styles.bad}`}
          >
            {waist.pctChange < 0 ? '↓' : waist.pctChange > 0 ? '↑' : '·'} {Math.abs(waist.pctChange)}%
          </span>
        </div>
      )}

      <div className={styles.evoPhrase}>{motivationalLine(evo, goal)}</div>
    </section>
  )
}
