import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import CameraStage from '../components/CameraStage'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import type { FoodAnalysis } from '../types'
import styles from './Scan.module.css'

type State = 'camera' | 'analyzing' | 'result'

export default function Scan() {
  const navigate = useNavigate()
  const { showMacros, addMeal } = useApp()
  const [state, setState] = useState<State>('camera')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [error, setError] = useState('')

  const analyze = async (input: { image?: string; text?: string }) => {
    setPhoto(input.image ?? null)
    setError('')
    setState('analyzing')
    try {
      const r = await ai.analyzeFood(input)
      setResult(r)
      setState('result')
    } catch (err) {
      console.error(err)
      setError('No se pudo analizar. Inténtalo de nuevo.')
      setState('camera')
    }
  }

  const register = () => {
    if (result) {
      addMeal({ name: result.name, score: result.score, macros: result.macros })
    }
    navigate('/home')
  }

  if (state === 'analyzing') {
    return (
      <div className="ach-fade">
        <Spinner title="Analizando…" subtitle="Proteína · ingredientes · saciedad" />
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className={`${styles.screen} ach-fade`}>
        <div
          className={styles.resultPhoto}
          style={photo ? { backgroundImage: `url(${photo})` } : undefined}
        >
          {!photo && <span className={styles.resultPhotoCaption}>FOTO COMIDA</span>}
        </div>

        <div className={styles.resultHead}>
          <div className={styles.resultScore}>{result.score}</div>
          <div className={styles.resultLabel}>Achilles Score</div>
          <div className={styles.resultName}>{result.name}</div>
        </div>

        <div className={styles.factors}>
          {result.factors.map((f, i) => (
            <div key={`${f.label}-${i}`} className={styles.factor}>
              <span style={{ color: f.positive ? 'var(--gold)' : 'var(--text-2)' }}>
                {f.positive ? '✔' : '⚠'}
              </span>
              <span style={{ color: f.positive ? 'var(--text)' : 'var(--text-2)' }}>{f.label}</span>
            </div>
          ))}
        </div>

        {showMacros && (
          <div className={styles.macros}>
            <Macro value={`${result.macros.protein}g`} label="Prot" />
            <Macro value={`${result.macros.carbs}g`} label="Carbs" />
            <Macro value={`${result.macros.fat}g`} label="Grasa" />
            <Macro value={`${result.macros.kcal}`} label="kcal" />
          </div>
        )}

        <div className={styles.resultActions}>
          <Button variant="ghost" block={false} className={styles.flex} onClick={() => setState('camera')}>
            Otra foto
          </Button>
          <Button block={false} className={styles.flex} onClick={register}>
            Registrar
          </Button>
        </div>
      </div>
    )
  }

  // camera (default)
  return (
    <div className={`${styles.screen} ach-fade`}>
      <h2 className={styles.title}>Escanear comida</h2>
      <p className={styles.subtitle}>Una foto. La IA hace el resto.</p>

      {error && <p className={styles.errorBanner}>{error}</p>}

      <CameraStage
        caption="APUNTA A TU COMIDA"
        ctaLabel="Capturar"
        onCapture={(image) => analyze({ image })}
      />

      <div className={styles.divider}>
        <span className={styles.line} />
        <span className={styles.or}>o describe</span>
        <span className={styles.line} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (description.trim()) analyze({ text: description.trim() })
        }}
      >
        <input
          className={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Pollo, arroz y aguacate"
          aria-label="Describe tu comida"
        />
      </form>
    </div>
  )
}

function Macro({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.macro}>
      <div className={styles.macroValue}>{value}</div>
      <div className={styles.macroLabel}>{label}</div>
    </div>
  )
}
