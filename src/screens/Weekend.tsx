import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import { estimateAlcoholKcal } from '../lib/metrics'
import BackLink from '../components/ui/BackLink'
import type { AlcoholLog, WeekendPlan } from '../types'
import styles from './Weekend.module.css'

type Kind = AlcoholLog['kind']

export default function Weekend() {
  const { profile, addAlcohol } = useApp()
  const [plan, setPlan] = useState<WeekendPlan | null>(null)
  const [strategy, setStrategy] = useState('')
  const [loading, setLoading] = useState(false)

  // Alcohol mode
  const [drinking, setDrinking] = useState(false)
  const [kind, setKind] = useState<Kind | null>(null)
  const [drinks, setDrinks] = useState(2)
  const [alcStrategy, setAlcStrategy] = useState('')
  const [alcLoading, setAlcLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const choose = async (p: WeekendPlan) => {
    setPlan(p)
    setLoading(true)
    setStrategy('')
    try {
      setStrategy(await ai.weekendStrategy(p, profile))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const genAlcohol = async (k: Kind) => {
    setKind(k)
    setAlcLoading(true)
    setAlcStrategy('')
    setSaved(false)
    try {
      setAlcStrategy(await ai.alcoholStrategy({ kind: k, drinks }, profile))
    } catch (err) {
      console.error(err)
    } finally {
      setAlcLoading(false)
    }
  }

  const estKcal = kind ? estimateAlcoholKcal(kind, drinks) : 0

  const registerDrink = () => {
    if (!kind) return
    addAlcohol({ kind, drinks: kind === 'spirits' ? drinks : 0, kcal: estKcal })
    setSaved(true)
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink />
      <h2 className={styles.title}>Weekend Mode</h2>
      <p className={styles.subtitle}>Dime tu plan y ajusto tu día.</p>

      <div className={styles.options}>
        <button className={styles.option} data-selected={plan === 'lunch'} onClick={() => choose('lunch')}>
          Hoy voy a comer fuera
        </button>
        <button className={styles.option} data-selected={plan === 'dinner'} onClick={() => choose('dinner')}>
          Hoy voy a cenar fuera
        </button>
      </div>

      {plan && (
        <div className={`${styles.strategy} ach-fade`}>
          <div className={styles.strategyEyebrow}>Tu estrategia de hoy</div>
          <div className={styles.strategyText}>{loading ? 'Calculando tu estrategia…' : strategy}</div>
        </div>
      )}

      {/* -------- Alcohol Mode -------- */}
      <div className={styles.alcohol}>
        <div className={styles.alcoholEyebrow}>Alcohol Mode</div>
        {!drinking ? (
          <button className={styles.alcoholOpen} onClick={() => setDrinking(true)}>
            🍷 Voy a beber hoy
          </button>
        ) : (
          <>
            <p className={styles.alcoholQ}>¿Qué vas a tomar? Lo mejor es un solo tipo de alcohol.</p>
            <div className={styles.kinds}>
              <button className={styles.kind} data-selected={kind === 'wine_beer'} onClick={() => genAlcohol('wine_beer')}>
                Solo vino o cerveza
              </button>
              <button className={styles.kind} data-selected={kind === 'spirits'} onClick={() => setKind('spirits')}>
                Voy a tomar copas
              </button>
            </div>

            {kind === 'spirits' && (
              <div className={styles.stepperRow}>
                <span className={styles.stepperLabel}>¿Cuántas copas, aprox.?</span>
                <div className={styles.stepper}>
                  <button className={styles.stepBtn} onClick={() => setDrinks((d) => Math.max(1, d - 1))} aria-label="Menos">
                    −
                  </button>
                  <span className={styles.stepVal}>{drinks}</span>
                  <button className={styles.stepBtn} onClick={() => setDrinks((d) => Math.min(12, d + 1))} aria-label="Más">
                    +
                  </button>
                </div>
              </div>
            )}

            {kind === 'spirits' && (
              <button className={styles.genBtn} onClick={() => genAlcohol('spirits')}>
                Ver estrategia
              </button>
            )}

            {(alcLoading || alcStrategy) && (
              <div className={`${styles.strategy} ach-fade`}>
                <div className={styles.strategyEyebrow}>Tu estrategia para beber</div>
                <div className={styles.strategyText}>
                  {alcLoading ? 'Calculando tu estrategia…' : alcStrategy}
                </div>
              </div>
            )}

            {alcStrategy && !alcLoading && (
              <div className={styles.estimate}>
                {saved ? (
                  <div className={styles.saved}>
                    ✔ Registrado. Mañana tu objetivo bajará ≈ {estKcal.toLocaleString('es-ES')} kcal para mantener el déficit.
                  </div>
                ) : (
                  <>
                    <div className={styles.estimateText}>
                      Estimado ≈ {estKcal.toLocaleString('es-ES')} kcal. Regístralo y mañana se restará de tu objetivo.
                    </div>
                    <button className={styles.genBtn} onClick={registerDrink}>
                      Registrar lo que beberé
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
