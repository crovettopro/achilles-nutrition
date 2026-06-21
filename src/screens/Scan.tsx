import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import {
  adjustedCalorieTarget,
  assessMeal,
  dailyTotals,
  dayStatus,
  mealScoreFromMacros,
  mealVerdict,
  proteinTarget,
} from '../lib/metrics'
import CameraStage from '../components/CameraStage'
import DailyTargets from '../components/DailyTargets'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import type { FoodAnalysis, Macros } from '../types'
import styles from './Scan.module.css'

type State = 'camera' | 'analyzing' | 'result'

export default function Scan() {
  const navigate = useNavigate()
  const { addMeal, meals, alcohol, profile } = useApp()
  const [state, setState] = useState<State>('camera')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

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

  const addManual = (item: { name: string; macros: Macros }) => {
    if (!result) return
    const macros: Macros = {
      protein: result.macros.protein + item.macros.protein,
      carbs: result.macros.carbs + item.macros.carbs,
      fat: result.macros.fat + item.macros.fat,
      kcal: result.macros.kcal + item.macros.kcal,
    }
    setResult({
      ...result,
      macros,
      calories: macros.kcal,
      score: mealScoreFromMacros(macros),
      ingredients: [
        ...(result.ingredients ?? []),
        { name: item.name, weight: 0, prep: 'manual', calories: item.macros.kcal },
      ],
    })
    setAdding(false)
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
    const assessment = assessMeal(result.macros)
    const kcalTarget = adjustedCalorieTarget(profile, alcohol).target
    const pTarget = proteinTarget(profile)
    const after = dailyTotals(meals)
    const totalsAfter = {
      ...after,
      protein: after.protein + Math.round(result.macros.protein),
      kcal: after.kcal + Math.round(result.macros.kcal),
      meals: after.meals + 1,
    }
    const status = dayStatus(totalsAfter, profile, kcalTarget)
    const verdict = mealVerdict(result, totalsAfter, profile, kcalTarget)

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
          <div className={styles.resultLabel}>Aquiles Score</div>
          <div className={styles.resultName}>{result.name}</div>
          <div className={styles.resultKcal}>≈ {result.macros.kcal} kcal</div>
        </div>

        <div className={styles.macros}>
          <Macro value={`${result.macros.protein}g`} label="Proteína" tone={assessment.protein === 'baja' ? 'warn' : 'good'} />
          <Macro value={`${result.macros.carbs}g`} label="Carbos" tone={assessment.carbs === 'altos' ? 'warn' : 'ok'} />
          <Macro value={`${result.macros.fat}g`} label="Grasa" tone={assessment.fat === 'alta' ? 'warn' : 'ok'} />
        </div>
        <p className={styles.macroComment}>{assessment.comment}</p>

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

        {result.ingredients && result.ingredients.length > 0 && (
          <div className={styles.ingredients}>
            <div className={styles.ingredientsHead}>Ingredientes detectados</div>
            {result.ingredients.map((ing, i) => (
              <div key={`${ing.name}-${i}`} className={styles.ingredientRow}>
                <span className={styles.ingredientName}>
                  {ing.name}
                  {ing.weight ? <span className={styles.ingredientWeight}> · {ing.weight} g</span> : null}
                  {ing.prep === 'manual' ? <span className={styles.ingredientWeight}> · añadido</span> : null}
                </span>
                <span className={styles.ingredientKcal}>{ing.calories} kcal</span>
              </div>
            ))}
            {result.confidence ? (
              <div className={styles.confidence}>Confianza del análisis · {result.confidence}%</div>
            ) : null}
          </div>
        )}

        {adding ? (
          <ManualItemForm onCancel={() => setAdding(false)} onAdd={addManual} />
        ) : (
          <button className={styles.addItem} onClick={() => setAdding(true)}>
            + Añadir un alimento que falte en la foto
          </button>
        )}

        {/* Daily accumulation vs targets */}
        <DailyTargets
          heading="Resumen del día · con esta comida"
          protein={totalsAfter.protein}
          proteinTarget={pTarget}
          kcal={totalsAfter.kcal}
          kcalTarget={kcalTarget}
          status={status}
        />

        <p className={styles.verdict}>{verdict}</p>

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

function Macro({ value, label, tone }: { value: string; label: string; tone: 'good' | 'ok' | 'warn' }) {
  const color = tone === 'warn' ? '#d9836b' : tone === 'good' ? 'var(--gold)' : 'var(--text)'
  return (
    <div className={styles.macro}>
      <div className={styles.macroValue} style={{ color }}>{value}</div>
      <div className={styles.macroLabel}>{label}</div>
    </div>
  )
}

/* -------------------- Manual ingredient form -------------------- */
function ManualItemForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void
  onAdd: (item: { name: string; macros: Macros }) => void
}) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const n = (s: string) => Math.max(0, parseFloat(s.replace(',', '.')) || 0)

  const submit = () => {
    const p = n(protein)
    const c = n(carbs)
    const f = n(fat)
    const k = n(kcal) || Math.round(p * 4 + c * 4 + f * 9)
    if (!name.trim() || (!k && !p && !c && !f)) return
    onAdd({ name: name.trim(), macros: { protein: p, carbs: c, fat: f, kcal: k } })
  }

  return (
    <div className={styles.manual}>
      <div className={styles.manualHead}>Añadir alimento</div>
      <input
        className={styles.manualName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej. Pan, salsa, refresco…"
        aria-label="Nombre del alimento"
      />
      <div className={styles.manualGrid}>
        <MiniField label="kcal" value={kcal} onChange={setKcal} />
        <MiniField label="Prot." value={protein} onChange={setProtein} />
        <MiniField label="Carb." value={carbs} onChange={setCarbs} />
        <MiniField label="Grasa" value={fat} onChange={setFat} />
      </div>
      <div className={styles.manualHint}>Si dejas las kcal vacías, las calculamos con los macros.</div>
      <div className={styles.manualActions}>
        <Button variant="ghost" block={false} className={styles.flex} onClick={onCancel}>
          Cancelar
        </Button>
        <Button block={false} className={styles.flex} onClick={submit}>
          Añadir
        </Button>
      </div>
    </div>
  )
}

function MiniField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={styles.miniField}>
      <span className={styles.miniLabel}>{label}</span>
      <input
        className={styles.miniInput}
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-label={label}
      />
    </label>
  )
}
