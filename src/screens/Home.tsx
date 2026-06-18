import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ScoreRing from '../components/ScoreRing'
import { formatToday, goalLabel, statusText } from '../lib/score'
import { dailyScore, mealsOn, todayISO, weeklyAdherence } from '../lib/metrics'
import styles from './Home.module.css'

function formatSteps(steps?: number): string {
  if (!steps) return '—'
  return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps)
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, meals, checkins } = useApp()

  const breakdown = dailyScore(meals, profile)
  const todaysMeals = mealsOn(meals, todayISO())
  const adherence = weeklyAdherence(meals)
  const proteinMet = breakdown.proteinGrams >= breakdown.proteinTarget && breakdown.hasData
  const latestSteps = checkins[0]?.steps

  return (
    <div className={`${styles.screen} ach-fade`}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>ACHILLES</div>
          <div className={styles.date}>{formatToday()}</div>
        </div>
        <button className={styles.avatar} onClick={() => navigate('/account')} aria-label="Tu cuenta">
          A
        </button>
      </header>

      {/* Score ring + status pill */}
      <section className={styles.scoreSection}>
        <ScoreRing score={breakdown.score} hasData={breakdown.hasData} />
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          <span>
            {breakdown.hasData ? statusText(breakdown.score) : 'Escanea tu primera comida'}
          </span>
        </div>
      </section>

      <div className={styles.goal}>
        Objetivo · <span>{goalLabel(profile.goal)}</span>
      </div>

      {/* Metrics */}
      <section className={styles.metrics}>
        <Metric value={`${adherence}%`} label="Adherencia" />
        <Metric value="✓" label="Proteína" gold={proteinMet} muted={!proteinMet} />
        <Metric value={formatSteps(latestSteps)} label="Pasos" />
      </section>

      {/* Quick actions */}
      <section className={styles.actions}>
        <button className={styles.actionCard} onClick={() => navigate('/restaurant')}>
          <div className={styles.actionTitle}>Modo Restaurante</div>
          <div className={styles.actionSub}>Qué pedir hoy</div>
        </button>
        <button className={styles.actionCard} onClick={() => navigate('/weekend')}>
          <div className={styles.actionTitle}>Weekend Mode</div>
          <div className={styles.actionSub}>Sal sin culpa</div>
        </button>
      </section>

      {/* Today's meals */}
      <section className={styles.mealsHeader}>
        <span className={styles.mealsTitle}>Hoy</span>
        <span className={styles.mealsCount}>
          {todaysMeals.length} {todaysMeals.length === 1 ? 'comida' : 'comidas'}
        </span>
      </section>

      {todaysMeals.length === 0 ? (
        <button className={styles.emptyMeals} onClick={() => navigate('/scan')}>
          <div className={styles.emptyTitle}>Aún no has registrado nada hoy</div>
          <div className={styles.emptySub}>Escanea tu primera comida →</div>
        </button>
      ) : (
        <section className={styles.mealsList}>
          {todaysMeals.map((meal) => (
            <div key={meal.id} className={styles.mealCard}>
              <div className={styles.mealInfo}>
                <div className={styles.mealName}>{meal.name}</div>
                <div className={styles.mealTime}>{meal.time}</div>
              </div>
              <div
                className={styles.mealScore}
                style={{ color: meal.score >= 85 ? 'var(--gold)' : 'var(--text-2)' }}
              >
                {meal.score}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function Metric({
  value,
  label,
  gold,
  muted,
}: {
  value: string
  label: string
  gold?: boolean
  muted?: boolean
}) {
  const color = gold ? 'var(--gold)' : muted ? 'var(--text-3)' : undefined
  return (
    <div className={styles.metric}>
      <div className={styles.metricValue} style={color ? { color } : undefined}>
        {value}
      </div>
      <div className={styles.metricLabel}>{label}</div>
    </div>
  )
}
