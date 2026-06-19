import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Button from '../../components/ui/Button'
import type { Activity } from '../../types'
import styles from './Onboarding.module.css'

type Step = 0 | 1 | 2 | 3

const ACTIVITIES: { key: Activity; title: string; sub: string }[] = [
  { key: 'low', title: 'Poco activo', sub: 'Menos de 7.000 pasos diarios' },
  { key: 'mid', title: 'Activo', sub: 'Entre 8.000 y 10.000 pasos diarios' },
  { key: 'high', title: 'Muy activo', sub: 'Entre 10.000 y 15.000 pasos diarios' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { profile, setGoal, setActivity, stepProfile, completeOnboarding } = useApp()
  const [step, setStep] = useState<Step>(0)

  const finish = () => {
    completeOnboarding()
    navigate('/home')
  }

  const next = () => setStep((s) => (Math.min(3, s + 1) as Step))

  return (
    <div className={styles.screen}>
      <div className={styles.scroll}>
        {step === 0 && <Welcome onStart={next} />}
        {step === 1 && (
          <Goal
            selected={profile.goal}
            onPick={(g) => {
              setGoal(g)
              next() // auto-advance: low-friction philosophy
            }}
          />
        )}
        {step === 2 && (
          <Data
            age={profile.age}
            weight={profile.weight}
            height={profile.height}
            onStep={stepProfile}
            onContinue={next}
          />
        )}
        {step === 3 && (
          <ActivityStep selected={profile.activity} onSelect={setActivity} onFinish={finish} />
        )}
      </div>
    </div>
  )
}

/* -------------------- Step 0: Welcome -------------------- */
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className={`${styles.welcome} ach-fade`}>
      <div className={styles.monogram}>ATC</div>
      <h1 className={styles.wordmark}>AQUILES</h1>
      <div className={styles.divider} />
      <p className={styles.tagline}>
        Construye el físico de Aquiles. Sin contar calorías. Sin obsesión.
      </p>
      <div className={styles.spacer} />
      <Button onClick={onStart} style={{ marginTop: 48 }}>
        Comenzar
      </Button>
    </div>
  )
}

/* -------------------- Step 1: Goal -------------------- */
function Goal({
  selected,
  onPick,
}: {
  selected: string
  onPick: (g: 'fat' | 'muscle') => void
}) {
  return (
    <div className={`${styles.step} ach-fade`}>
      <div className={styles.eyebrow}>Paso 1 de 3</div>
      <h2 className={styles.title}>¿Cuál es tu objetivo?</h2>
      <button
        className={styles.optionCard}
        data-selected={selected === 'fat'}
        onClick={() => onPick('fat')}
      >
        <div className={styles.optionTitle}>Perder grasa</div>
        <div className={styles.optionSub}>Defínete sin sacrificar tu estilo de vida.</div>
      </button>
      <button
        className={styles.optionCard}
        data-selected={selected === 'muscle'}
        onClick={() => onPick('muscle')}
      >
        <div className={styles.optionTitle}>Ganar músculo limpio</div>
        <div className={styles.optionSub}>Masa de calidad, manteniéndote definido.</div>
      </button>
    </div>
  )
}

/* -------------------- Step 2: Data -------------------- */
function Data({
  age,
  weight,
  height,
  onStep,
  onContinue,
}: {
  age: number
  weight: number
  height: number
  onStep: (field: 'age' | 'weight' | 'height', delta: number) => void
  onContinue: () => void
}) {
  return (
    <div className={`${styles.step} ach-fade`}>
      <div className={styles.eyebrow}>Paso 2 de 3</div>
      <h2 className={styles.title}>Cuéntanos sobre ti</h2>
      <div className={styles.stepperList}>
        <Stepper label="Edad" value={age} onDec={() => onStep('age', -1)} onInc={() => onStep('age', 1)} />
        <Stepper label="Peso · kg" value={weight} onDec={() => onStep('weight', -1)} onInc={() => onStep('weight', 1)} />
        <Stepper label="Altura · cm" value={height} onDec={() => onStep('height', -1)} onInc={() => onStep('height', 1)} />
      </div>
      <Button onClick={onContinue} style={{ marginTop: 28 }}>
        Continuar
      </Button>
    </div>
  )
}

function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string
  value: number
  onDec: () => void
  onInc: () => void
}) {
  return (
    <div className={styles.stepperRow}>
      <span className={styles.stepperLabel}>{label}</span>
      <div className={styles.stepperControls}>
        <button className={styles.circleBtn} onClick={onDec} aria-label={`Bajar ${label}`}>
          −
        </button>
        <span className={styles.stepperValue}>{value}</span>
        <button className={styles.circleBtn} onClick={onInc} aria-label={`Subir ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

/* -------------------- Step 3: Activity -------------------- */
function ActivityStep({
  selected,
  onSelect,
  onFinish,
}: {
  selected: Activity
  onSelect: (a: Activity) => void
  onFinish: () => void
}) {
  return (
    <div className={`${styles.step} ach-fade`}>
      <div className={styles.eyebrow}>Paso 3 de 3</div>
      <h2 className={styles.title}>¿Cómo es tu día a día?</h2>
      {ACTIVITIES.map((a) => (
        <button
          key={a.key}
          className={styles.optionCard}
          data-selected={selected === a.key}
          onClick={() => onSelect(a.key)}
        >
          <div className={styles.activityTitle}>{a.title}</div>
          <div className={styles.activitySub}>{a.sub}</div>
        </button>
      ))}
      <Button onClick={onFinish} style={{ marginTop: 14 }}>
        Crear mi protocolo
      </Button>
    </div>
  )
}
