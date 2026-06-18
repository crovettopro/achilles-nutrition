import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import BackLink from '../components/ui/BackLink'
import type { WeekendPlan } from '../types'
import styles from './Weekend.module.css'

export default function Weekend() {
  const { profile } = useApp()
  const [plan, setPlan] = useState<WeekendPlan | null>(null)
  const [strategy, setStrategy] = useState('')
  const [loading, setLoading] = useState(false)

  const choose = async (p: WeekendPlan) => {
    setPlan(p)
    setLoading(true)
    setStrategy('')
    try {
      const s = await ai.weekendStrategy(p, profile)
      setStrategy(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink />
      <h2 className={styles.title}>Weekend Mode</h2>
      <p className={styles.subtitle}>Dime tu plan y ajusto tu día.</p>

      <div className={styles.options}>
        <button
          className={styles.option}
          data-selected={plan === 'lunch'}
          onClick={() => choose('lunch')}
        >
          Hoy voy a comer fuera
        </button>
        <button
          className={styles.option}
          data-selected={plan === 'dinner'}
          onClick={() => choose('dinner')}
        >
          Hoy voy a cenar fuera
        </button>
      </div>

      {plan && (
        <div className={`${styles.strategy} ach-fade`}>
          <div className={styles.strategyEyebrow}>Tu estrategia de hoy</div>
          <div className={styles.strategyText}>
            {loading ? 'Calculando tu estrategia…' : strategy}
          </div>
        </div>
      )}
    </div>
  )
}
