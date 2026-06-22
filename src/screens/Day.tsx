import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ScoreRing from '../components/ScoreRing'
import DailyTargets from '../components/DailyTargets'
import MealEditSheet from '../components/MealEditSheet'
import BackLink from '../components/ui/BackLink'
import { formatLongDate, statusText } from '../lib/score'
import {
  adjustedCalorieTarget,
  alcoholKcalOn,
  byTime,
  dailyScore,
  dailyTotals,
  dayStatus,
  isToday as isTodayISO,
  isValidISO,
  mealsOn,
  nextISO,
  previousISO,
  proteinTarget,
  todayISO,
} from '../lib/metrics'
import type { Meal } from '../types'
import styles from './Day.module.css'

export default function Day() {
  const { date } = useParams()
  const navigate = useNavigate()
  const { profile, meals, alcohol, restoreMeal } = useApp()

  const [editing, setEditing] = useState<Meal | null>(null)
  const [adding, setAdding] = useState(false)
  const [undo, setUndo] = useState<Meal | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(undoTimer.current), [])

  // Guard: malformed or future dates are never valid.
  if (!isValidISO(date) || date > todayISO()) return <Navigate to="/home" replace />

  const today = isTodayISO(date)
  const breakdown = dailyScore(meals, profile, date)
  const totals = dailyTotals(meals, date)
  const adj = adjustedCalorieTarget(profile, alcohol, date)
  // Past empty days get a past-tense, neutral status (not the "empieza" CTA).
  const dStatus =
    totals.meals === 0 && !today
      ? { label: 'Sin registros este día', tone: 'neutral' as const }
      : dayStatus(totals, profile, adj.target)
  const dayMeals = [...mealsOn(meals, date)].sort(byTime)
  const drank = alcoholKcalOn(alcohol, date) > 0

  const onDeleted = (m: Meal) => {
    setUndo(m)
    clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), 6000)
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to="/home" label="Inicio" />

      {/* Date navigator */}
      <div className={styles.dateNav}>
        <button className={styles.chev} onClick={() => navigate(`/day/${previousISO(date)}`)} aria-label="Día anterior">
          ‹
        </button>
        <div className={styles.dateTitle}>
          {formatLongDate(date)}
          {today && <span className={styles.todayTag}>Hoy</span>}
        </div>
        <button
          className={styles.chev}
          onClick={() => navigate(`/day/${nextISO(date)}`)}
          disabled={today}
          aria-label="Día siguiente"
        >
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
        heading={`${today ? 'Hoy' : formatLongDate(date).split(',')[0]} vs tu objetivo`}
        protein={totals.protein}
        proteinTarget={proteinTarget(profile)}
        kcal={totals.kcal}
        kcalTarget={adj.target}
        status={dStatus}
        penalty={adj.penalty}
      />

      {drank && <div className={styles.alcoholNote}>Registraste alcohol este día — se descontó del objetivo del día siguiente.</div>}

      {/* Meals */}
      <section className={styles.mealsHeader}>
        <span className={styles.mealsTitle}>Comidas</span>
        <span className={styles.mealsCount}>
          {dayMeals.length} {dayMeals.length === 1 ? 'comida' : 'comidas'}
        </span>
      </section>

      {dayMeals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>{today ? 'Aún no has registrado nada hoy' : 'No registraste nada este día'}</div>
          <div className={styles.emptySub}>Añade lo que comiste abajo ↓</div>
        </div>
      ) : (
        <section className={styles.mealsList}>
          {dayMeals.map((meal) => (
            <button key={meal.id} className={styles.mealCard} onClick={() => setEditing(meal)}>
              <div className={styles.mealInfo}>
                <div className={styles.mealName}>{meal.name}</div>
                <div className={styles.mealTime}>
                  {/^\d{2}:\d{2}$/.test(meal.time) ? meal.time : '—'} · {meal.macros.kcal} kcal · {meal.macros.protein}g prot.
                </div>
              </div>
              <div className={styles.mealScore} style={{ color: meal.score >= 85 ? 'var(--gold)' : 'var(--text-2)' }}>
                {meal.score}
              </div>
            </button>
          ))}
        </section>
      )}

      <div className={styles.addRow}>
        <button className={styles.addBtn} onClick={() => setAdding(true)}>
          + Añadir comida{today ? '' : ' a este día'}
        </button>
        <button className={styles.scanLink} onClick={() => navigate(`/scan?date=${date}`)}>
          o escanear una foto
        </button>
      </div>

      {editing && <MealEditSheet meal={editing} onClose={() => setEditing(null)} onDeleted={onDeleted} />}
      {adding && <MealEditSheet date={date} onClose={() => setAdding(false)} />}

      {undo && (
        <div className={styles.undo}>
          <span>Comida eliminada</span>
          <button
            onClick={() => {
              clearTimeout(undoTimer.current)
              restoreMeal(undo)
              setUndo(null)
            }}
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  )
}
