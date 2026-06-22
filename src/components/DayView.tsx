import ScoreRing from './ScoreRing'
import DailyTargets from './DailyTargets'
import { formatLongDate, statusText } from '../lib/score'
import {
  adjustedCalorieTarget,
  alcoholKcalOn,
  byTime,
  dailyScore,
  dailyTotals,
  dayStatus,
  isToday as isTodayISO,
  mealsOn,
  nextISO,
  previousISO,
  proteinTarget,
} from '../lib/metrics'
import type { AlcoholLog, Meal, Profile } from '../types'
import styles from './DayView.module.css'

/**
 * Presentational day summary: score ring, daily targets, and the day's meals.
 * Shared by the athlete (editable: pass onMealClick) and the coach (read-only).
 * Pure over (date, meals, profile, alcohol) — every figure is derived.
 */
export default function DayView({
  date,
  meals,
  profile,
  alcohol,
  onNavigate,
  onMealClick,
}: {
  date: string
  meals: Meal[]
  profile: Profile
  alcohol: AlcoholLog[]
  onNavigate: (iso: string) => void
  /** When provided, meal cards become buttons (athlete edit). */
  onMealClick?: (meal: Meal) => void
}) {
  const today = isTodayISO(date)
  const breakdown = dailyScore(meals, profile, date)
  const totals = dailyTotals(meals, date)
  const adj = adjustedCalorieTarget(profile, alcohol, date)
  const dStatus =
    totals.meals === 0 && !today
      ? { label: 'Sin registros este día', tone: 'neutral' as const }
      : dayStatus(totals, profile, adj.target)
  const dayMeals = [...mealsOn(meals, date)].sort(byTime)
  const drank = alcoholKcalOn(alcohol, date) > 0
  const weekday = formatLongDate(date).split(',')[0]

  return (
    <>
      {/* Date navigator */}
      <div className={styles.dateNav}>
        <button className={styles.chev} onClick={() => onNavigate(previousISO(date))} aria-label="Día anterior">
          ‹
        </button>
        <div className={styles.dateTitle}>
          {formatLongDate(date)}
          {today && <span className={styles.todayTag}>Hoy</span>}
        </div>
        <button className={styles.chev} onClick={() => onNavigate(nextISO(date))} disabled={today} aria-label="Día siguiente">
          ›
        </button>
      </div>

      {/* Score ring + status pill */}
      <section className={styles.scoreSection}>
        <ScoreRing score={breakdown.score} hasData={breakdown.hasData} />
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          <span>
            {breakdown.hasData ? statusText(breakdown.score) : today ? 'Aún no has registrado nada hoy' : 'Día sin registros'}
          </span>
        </div>
      </section>

      <DailyTargets
        heading={`${today ? 'Hoy' : weekday} vs tu objetivo`}
        protein={totals.protein}
        proteinTarget={proteinTarget(profile)}
        kcal={totals.kcal}
        kcalTarget={adj.target}
        status={dStatus}
        penalty={adj.penalty}
      />

      {drank && <div className={styles.alcoholNote}>Registró alcohol este día — se descontó del objetivo del día siguiente.</div>}

      {/* Meals */}
      <section className={styles.mealsHeader}>
        <span className={styles.mealsTitle}>Comidas</span>
        <span className={styles.mealsCount}>
          {dayMeals.length} {dayMeals.length === 1 ? 'comida' : 'comidas'}
        </span>
      </section>

      {dayMeals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>{today ? 'Aún no has registrado nada hoy' : 'Sin comidas registradas este día'}</div>
        </div>
      ) : (
        <section className={styles.mealsList}>
          {dayMeals.map((meal) => {
            const inner = (
              <>
                <div className={styles.mealInfo}>
                  <div className={styles.mealName}>{meal.name}</div>
                  <div className={styles.mealTime}>
                    {/^\d{2}:\d{2}$/.test(meal.time) ? meal.time : '—'} · {meal.macros.kcal} kcal · {meal.macros.protein}g prot.
                  </div>
                </div>
                <div className={styles.mealScore} style={{ color: meal.score >= 85 ? 'var(--gold)' : 'var(--text-2)' }}>
                  {meal.score}
                </div>
              </>
            )
            return onMealClick ? (
              <button key={meal.id} className={styles.mealCard} onClick={() => onMealClick(meal)}>
                {inner}
              </button>
            ) : (
              <div key={meal.id} className={styles.mealCard}>
                {inner}
              </div>
            )
          })}
        </section>
      )}
    </>
  )
}
