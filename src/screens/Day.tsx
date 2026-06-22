import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import DayView from '../components/DayView'
import MealEditSheet from '../components/MealEditSheet'
import BackLink from '../components/ui/BackLink'
import { isToday as isTodayISO, isValidISO, todayISO } from '../lib/metrics'
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

  const onDeleted = (m: Meal) => {
    setUndo(m)
    clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), 6000)
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to="/home" label="Inicio" />

      <DayView
        date={date}
        meals={meals}
        profile={profile}
        alcohol={alcohol}
        onNavigate={(iso) => navigate(`/day/${iso}`)}
        onMealClick={setEditing}
      />

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
