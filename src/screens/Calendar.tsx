import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import BackLink from '../components/ui/BackLink'
import { scoreTone } from '../lib/score'
import { dailyScore, mealsOn, todayISO } from '../lib/metrics'
import styles from './Calendar.module.css'

const WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

export default function Calendar() {
  const navigate = useNavigate()
  const { meals, profile } = useApp()

  const today = todayISO()
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]
  const [year, setYear] = useState(ty)
  const [month, setMonth] = useState(tm) // 0–11

  const atCurrentMonth = year === ty && month === tm

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const lead = (first.getDay() + 6) % 7 // Monday-first offset
    const days = new Date(year, month + 1, 0).getDate()
    const out: ({ date: string; day: number } | null)[] = []
    for (let i = 0; i < lead; i++) out.push(null)
    for (let d = 1; d <= days; d++) out.push({ date: iso(year, month, d), day: d })
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [year, month])

  // Monthly summary: logged days + average score.
  const summary = useMemo(() => {
    const logged = cells.filter((c) => c && mealsOn(meals, c.date).length > 0) as { date: string }[]
    if (logged.length === 0) return { count: 0, avg: 0 }
    const avg = Math.round(
      logged.reduce((s, c) => s + dailyScore(meals, profile, c.date).score, 0) / logged.length,
    )
    return { count: logged.length, avg }
  }, [cells, meals, profile])

  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  )

  const go = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to="/home" label="Inicio" />
      <h2 className={styles.title}>Historial</h2>
      <p className={styles.subtitle}>Toca un día para revisarlo o registrar el pasado.</p>

      <div className={styles.monthNav}>
        <button className={styles.chev} onClick={() => go(-1)} aria-label="Mes anterior">
          ‹
        </button>
        <div className={styles.monthLabel}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</div>
        <button className={styles.chev} onClick={() => go(1)} disabled={atCurrentMonth} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      {summary.count > 0 && (
        <div className={styles.summary}>
          {summary.count} {summary.count === 1 ? 'día registrado' : 'días registrados'} · media{' '}
          <span style={{ color: scoreTone(summary.avg) }}>{summary.avg}</span>
        </div>
      )}

      <div className={styles.weekRow}>
        {WEEK.map((w, i) => (
          <span key={i} className={styles.weekDay}>
            {w}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((c, i) => {
          if (!c) return <span key={i} className={styles.blank} />
          const future = c.date > today
          const logged = mealsOn(meals, c.date).length > 0
          const score = logged ? dailyScore(meals, profile, c.date).score : null
          const isToday = c.date === today
          return (
            <button
              key={i}
              className={`${styles.cell} ${isToday ? styles.cellToday : ''}`}
              disabled={future}
              onClick={() => navigate(`/day/${c.date}`)}
            >
              <span className={styles.cellNum}>{c.day}</span>
              {logged ? (
                <span className={styles.cellScore} style={{ color: scoreTone(score!) }}>
                  {score}
                </span>
              ) : (
                <span className={`${styles.cellDot} ${future ? styles.cellDotFuture : ''}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
