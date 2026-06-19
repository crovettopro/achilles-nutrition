import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { bodyTrend, dailyScore, mealsOn, progressEvolution, todayISO, weeklyAdherence } from '../../lib/metrics'
import { goalLabel } from '../../lib/score'
import Button from '../../components/ui/Button'
import EvolutionCard from '../../components/EvolutionCard'
import type { AuthUser, Checkin, Meal, Profile } from '../../types'
import styles from './Coach.module.css'

interface Detail {
  athlete: AuthUser
  profile: Profile | null
  meals: Meal[]
  checkins: Checkin[]
}

export default function CoachAthlete() {
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

  const { athlete, profile, meals, checkins } = data
  const score = profile ? dailyScore(meals, profile) : { score: 0, hasData: false }
  const adherence = weeklyAdherence(meals)
  const todays = mealsOn(meals, todayISO())
  const trend = bodyTrend(checkins, profile?.goal ?? 'fat')
  const evo = progressEvolution(checkins)

  return (
    <div className={`${styles.screen} ach-fade`}>
      <header className={styles.detailHeader}>
        <button className={styles.back} onClick={() => navigate('/coach')} aria-label="Volver">
          ←
        </button>
        <div>
          <h1 className={styles.detailName}>{athlete.name}</h1>
          <div className={styles.detailMeta}>
            {profile ? goalLabel(profile.goal) : '—'} · {athlete.email}
          </div>
        </div>
      </header>

      <div className={styles.statRow}>
        <Stat big value={score.hasData ? String(score.score) : '—'} label="Score hoy" gold />
        <Stat value={`${adherence}%`} label="Adherencia" />
        <Stat value={String(todays.length)} label="Comidas hoy" />
      </div>

      <Button onClick={() => navigate(`/coach/chat/${athlete.id}`)} style={{ margin: '4px 0 22px' }}>
        Enviar mensaje
      </Button>

      <EvolutionCard evo={evo} goal={profile?.goal ?? 'fat'} />

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Tendencia</span>
      </div>
      <div className={styles.panel}>
        {trend.latest ? (
          <>
            <Row label="Peso" value={`${trend.latest.weightKg} kg`} delta={trend.weightDelta} unit="kg" />
            <Row label="Cintura" value={`${trend.latest.waistCm} cm`} delta={trend.waistDelta} unit="cm" />
            <Row label="Pasos" value={`${(trend.latest.steps / 1000).toFixed(1)}k`} />
          </>
        ) : (
          <div className={styles.muted}>Sin check-ins todavía.</div>
        )}
      </div>

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Comidas de hoy</span>
        <span className={styles.count}>{todays.length}</span>
      </div>
      {todays.length === 0 ? (
        <div className={styles.empty}>Hoy no ha registrado comidas.</div>
      ) : (
        <div className={styles.list}>
          {todays.map((m) => (
            <div key={m.id} className={styles.mealRow}>
              <div>
                <div className={styles.mealName}>{m.name}</div>
                <div className={styles.mealTime}>{m.time}</div>
              </div>
              <div
                className={styles.mealScore}
                style={{ color: m.score >= 85 ? 'var(--gold)' : 'var(--text-2)' }}
              >
                {m.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({
  value,
  label,
  big,
  gold,
}: {
  value: string
  label: string
  big?: boolean
  gold?: boolean
}) {
  return (
    <div className={styles.stat}>
      <div
        className={big ? styles.statBig : styles.statValue}
        style={gold ? { color: 'var(--gold)' } : undefined}
      >
        {value}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function Row({
  label,
  value,
  delta,
  unit,
}: {
  label: string
  value: string
  delta?: number
  unit?: string
}) {
  return (
    <div className={styles.trendRow}>
      <span className={styles.trendLabel}>{label}</span>
      <span className={styles.trendValue}>
        {value}
        {delta !== undefined && (
          <span className={styles.trendDelta} style={{ color: delta <= 0 ? 'var(--gold)' : 'var(--text-2)' }}>
            {' '}
            {delta > 0 ? '+' : delta < 0 ? '−' : ''}
            {Math.abs(delta)}
            {unit}
          </span>
        )}
      </span>
    </div>
  )
}
