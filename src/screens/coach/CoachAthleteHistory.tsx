import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import BackLink from '../../components/ui/BackLink'
import MonthCalendar from '../../components/MonthCalendar'
import type { AlcoholLog, AuthUser, Checkin, Meal, Profile } from '../../types'
import styles from './Coach.module.css'

interface Detail {
  athlete: AuthUser
  profile: Profile | null
  meals: Meal[]
  checkins: Checkin[]
  alcohol: AlcoholLog[]
}

const FALLBACK: Profile = { goal: 'fat', age: 30, weight: 80, height: 178, activity: 'mid', onboarded: true }

export default function CoachAthleteHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Detail>(`/coach/athletes/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className={styles.screen}><div className={styles.muted}>Cargando…</div></div>
  if (!data) return <div className={styles.screen}><div className={styles.muted}>No encontrado.</div></div>

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to={`/coach/athlete/${id}`} label={data.athlete.name} />
      <h2 className={styles.histTitle}>Historial</h2>
      <p className={styles.histSub}>Toca un día para ver lo que registró tu alumno.</p>

      <MonthCalendar
        meals={data.meals}
        profile={data.profile ?? FALLBACK}
        onSelectDate={(d) => navigate(`/coach/athlete/${id}/day/${d}`)}
      />
    </div>
  )
}
