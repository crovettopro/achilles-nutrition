import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import BackLink from '../../components/ui/BackLink'
import DayView from '../../components/DayView'
import { isValidISO, todayISO } from '../../lib/metrics'
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

export default function CoachAthleteDay() {
  const { id, date } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Detail>(`/coach/athletes/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (!isValidISO(date) || date > todayISO()) return <Navigate to={`/coach/athlete/${id}/calendar`} replace />
  if (loading) return <div className={styles.screen}><div className={styles.muted}>Cargando…</div></div>
  if (!data) return <div className={styles.screen}><div className={styles.muted}>No encontrado.</div></div>

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to={`/coach/athlete/${id}/calendar`} label={`${data.athlete.name} · Historial`} />
      <DayView
        date={date}
        meals={data.meals}
        profile={data.profile ?? FALLBACK}
        alcohol={data.alcohol ?? []}
        onNavigate={(iso) => navigate(`/coach/athlete/${id}/day/${iso}`)}
      />
    </div>
  )
}
