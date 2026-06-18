import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import styles from './Coach.module.css'

interface AthleteSummary {
  id: string
  name: string
  email: string
  goal: 'fat' | 'muscle' | null
  score: number | null
  adherence: number
  lastActivity: string | null
  mealsToday: number
}

function ago(dateISO: string | null): string {
  if (!dateISO) return 'Sin actividad'
  const days = Math.round((Date.now() - new Date(dateISO + 'T12:00:00').getTime()) / 86400000)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

export default function CoachHome() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [athletes, setAthletes] = useState<AthleteSummary[]>([])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<{ athletes: AthleteSummary[] }>('/coach/athletes'),
      api<{ coachCode: string }>('/coach/me'),
    ])
      .then(([a, c]) => {
        setAthletes(a.athletes)
        setCode(c.coachCode)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={`${styles.screen} ach-fade`}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>ACHILLES · PREPARADOR</div>
          <h1 className={styles.hello}>Hola, {user?.name}</h1>
        </div>
        <button className={styles.logout} onClick={logout}>
          Salir
        </button>
      </header>

      <div className={styles.codeCard}>
        <div className={styles.codeLabel}>Tu código de invitación</div>
        <div className={styles.code}>{code || '…'}</div>
        <div className={styles.codeHint}>Compártelo con tus alumnos para que te sigan.</div>
      </div>

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Tus alumnos</span>
        <span className={styles.count}>{athletes.length}</span>
      </div>

      {loading ? (
        <div className={styles.muted}>Cargando…</div>
      ) : athletes.length === 0 ? (
        <div className={styles.empty}>
          Aún no tienes alumnos. Comparte tu código para que se vinculen.
        </div>
      ) : (
        <div className={styles.list}>
          {athletes.map((a) => (
            <button
              key={a.id}
              className={styles.athleteCard}
              onClick={() => navigate(`/coach/athlete/${a.id}`)}
            >
              <div className={styles.avatar}>{a.name.charAt(0).toUpperCase()}</div>
              <div className={styles.info}>
                <div className={styles.name}>{a.name}</div>
                <div className={styles.meta}>
                  {a.goal === 'muscle' ? 'Ganar músculo' : 'Perder grasa'} · {ago(a.lastActivity)}
                </div>
                <div className={styles.bars}>
                  <span className={styles.bar}>Adherencia {a.adherence}%</span>
                </div>
              </div>
              <div
                className={styles.score}
                style={{ color: (a.score ?? 0) >= 85 ? 'var(--gold)' : 'var(--text-2)' }}
              >
                {a.score ?? '—'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
