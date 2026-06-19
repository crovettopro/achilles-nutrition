import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Button from '../components/ui/Button'
import Sparkline from '../components/Sparkline'
import { fileToDataUrl } from '../lib/image'
import {
  bodyTrend,
  motivationalLine,
  progressEvolution,
  shortDate,
  trendText,
  type EvolutionMetric,
} from '../lib/metrics'
import styles from './Progress.module.css'

export default function Progress() {
  const { profile, checkins, addCheckin } = useApp()
  const [editing, setEditing] = useState(false)

  const trend = bodyTrend(checkins, profile.goal)
  const latest = trend.latest
  const evo = progressEvolution(checkins)

  const num = (n: number) => n.toLocaleString('es-ES')
  const fmtDelta = (d?: number, unit = '') =>
    d === undefined ? '' : `${d > 0 ? '+' : d < 0 ? '−' : ''}${num(Math.abs(d))}${unit}`

  return (
    <div className={`${styles.screen} ach-fade`}>
      <h2 className={styles.title}>Seguimiento semanal</h2>
      <p className={styles.subtitle}>Una vez por semana. Nada más.</p>

      {evo.weight && (
        <Evolution metric={evo.weight} waist={evo.waist} weeks={evo.weeks} count={evo.count}
          goalDown={profile.goal === 'fat'} phrase={motivationalLine(evo, profile.goal)} num={num} />
      )}

      <div className={styles.trend}>
        <div className={styles.trendEyebrow}>Tendencia</div>
        <div className={styles.trendText}>{trendText(trend, profile.goal)}</div>
      </div>

      {latest ? (
        <div className={styles.rows}>
          <Row
            label="Peso"
            meta={`${shortDate(latest.date)} · ${num(latest.weightKg)} kg`}
            delta={fmtDelta(trend.weightDelta, ' kg')}
            positive={trend.onTrack}
          />
          <Row
            label="Cintura"
            meta={`Último · ${num(latest.waistCm)} cm`}
            delta={fmtDelta(trend.waistDelta, ' cm')}
            positive={(trend.waistDelta ?? 0) <= 0}
          />
          <Row label="Pasos" meta="Esta semana" delta={`${(latest.steps / 1000).toFixed(1)}k`} />
          <Row
            label="Foto progreso"
            meta={latest.photo ? 'Añadida' : 'Pendiente esta semana'}
            delta={latest.photo ? '✓' : 'Añadir →'}
            positive={!!latest.photo}
          />
        </div>
      ) : (
        <div className={styles.empty}>
          Aún no tienes ningún registro. Haz tu primer check-in para empezar a ver tu progreso.
        </div>
      )}

      <Button onClick={() => setEditing(true)}>Registrar esta semana</Button>

      {editing && (
        <CheckinForm
          initial={latest}
          onCancel={() => setEditing(false)}
          onSave={(data) => {
            addCheckin(data)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}

/* -------------------- Evolution card (fine chart) -------------------- */
function Evolution({
  metric,
  waist,
  weeks,
  count,
  goalDown,
  phrase,
  num,
}: {
  metric: EvolutionMetric
  waist?: EvolutionMetric
  weeks: number
  count: number
  /** True when going DOWN is good (fat loss). */
  goalDown: boolean
  phrase: string
  num: (n: number) => string
}) {
  // For a fat-loss goal a drop is good (gold); for muscle a rise is good.
  const good = goalDown ? metric.pctChange < 0 : metric.pctChange > 0
  const arrow = metric.pctChange < 0 ? '↓' : metric.pctChange > 0 ? '↑' : '·'
  const pctText = `${arrow} ${Math.abs(metric.pctChange)}%`

  const fmtAbs = (v: number, unit: string) =>
    `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v))} ${unit}`

  return (
    <section className={styles.evo}>
      <div className={styles.evoHead}>
        <span className={styles.evoEyebrow}>Evolución · Peso</span>
        <span className={styles.evoRange}>
          {shortDate(metric.firstDate)} → {shortDate(metric.lastDate)}
        </span>
      </div>

      <div className={styles.evoMain}>
        <div className={styles.evoValue}>
          {num(metric.last)}
          <span className={styles.evoUnit}>kg</span>
        </div>
        <div className={`${styles.evoChange} ${good ? styles.good : styles.bad}`}>{pctText}</div>
      </div>

      <Sparkline values={metric.series.map((p) => p.value)} />

      <div className={styles.evoMeta}>
        {count} mediciones · {fmtAbs(metric.absChange, 'kg')} en {weeks} {weeks === 1 ? 'semana' : 'semanas'}
      </div>

      {waist && (
        <div className={styles.evoWaist}>
          <div className={styles.evoWaistInfo}>
            <span className={styles.evoWaistLabel}>Cintura</span>
            <span className={styles.evoWaistValue}>{num(waist.last)} cm</span>
          </div>
          <div className={styles.evoWaistSpark}>
            <Sparkline values={waist.series.map((p) => p.value)} height={34} color="var(--text-2)" />
          </div>
          <span
            className={`${styles.evoWaistChange} ${(goalDown ? waist.pctChange < 0 : waist.pctChange > 0) ? styles.good : styles.bad}`}
          >
            {waist.pctChange < 0 ? '↓' : waist.pctChange > 0 ? '↑' : '·'} {Math.abs(waist.pctChange)}%
          </span>
        </div>
      )}

      <div className={styles.evoPhrase}>{phrase}</div>
    </section>
  )
}

function Row({
  label,
  meta,
  delta,
  positive,
}: {
  label: string
  meta: string
  delta: string
  positive?: boolean
}) {
  return (
    <div className={styles.row}>
      <div>
        <div className={styles.rowLabel}>{label}</div>
        <div className={styles.rowMeta}>{meta}</div>
      </div>
      <span
        className={styles.rowDelta}
        style={{ color: positive ? 'var(--gold)' : 'var(--text-2)' }}
      >
        {delta}
      </span>
    </div>
  )
}

/* -------------------- Check-in form (modal sheet) -------------------- */
function CheckinForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: { weightKg: number; waistCm: number; steps: number }
  onCancel: () => void
  onSave: (data: { weightKg: number; waistCm: number; steps: number; photo?: string }) => void
}) {
  const [weight, setWeight] = useState(String(initial?.weightKg ?? 82))
  const [waist, setWaist] = useState(String(initial?.waistCm ?? 84))
  const [steps, setSteps] = useState(String(initial?.steps ?? 8000))
  const [photo, setPhoto] = useState<string | undefined>()

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPhoto(await fileToDataUrl(file))
  }

  const submit = () => {
    onSave({
      weightKg: parseFloat(weight.replace(',', '.')) || 0,
      waistCm: parseFloat(waist.replace(',', '.')) || 0,
      steps: parseInt(steps, 10) || 0,
      photo,
    })
  }

  return (
    <div className={styles.sheetBackdrop} onClick={onCancel}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <h3 className={styles.sheetTitle}>Tu check-in</h3>

        <Field label="Peso · kg" value={weight} onChange={setWeight} inputMode="decimal" />
        <Field label="Cintura · cm" value={waist} onChange={setWaist} inputMode="decimal" />
        <Field
          label="Pasos esta semana"
          value={steps}
          onChange={setSteps}
          inputMode="numeric"
        />

        <label className={styles.photoRow}>
          <span>{photo ? 'Foto añadida ✓' : 'Foto de progreso (opcional)'}</span>
          <input type="file" accept="image/*" onChange={onPhoto} hidden />
          <span className={styles.photoBtn}>{photo ? 'Cambiar' : 'Añadir'}</span>
        </label>

        <div className={styles.sheetActions}>
          <Button variant="ghost" block={false} className={styles.flex} onClick={onCancel}>
            Cancelar
          </Button>
          <Button block={false} className={styles.flex} onClick={submit}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  inputMode: 'decimal' | 'numeric'
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.fieldInput}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </label>
  )
}
