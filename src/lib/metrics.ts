import type { Checkin, Meal, Profile } from '../types'

/* ============================================================
   Achilles Nutrition — the engine behind the numbers.
   These targets are computed internally and (per the Achilles
   philosophy) are NEVER shown to the user as raw figures.
   ============================================================ */

const ACTIVITY_FACTOR: Record<Profile['activity'], number> = {
  low: 1.375,
  mid: 1.55,
  high: 1.725,
}

/** Basal metabolic rate (Mifflin-St Jeor, male). */
function bmr(p: Profile): number {
  return 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
}

/** Maintenance calories (TDEE). Hidden from the user. */
export function maintenanceKcal(p: Profile): number {
  return Math.round(bmr(p) * ACTIVITY_FACTOR[p.activity])
}

/**
 * Daily protein target in grams. Higher when cutting fat (preserve muscle)
 * than when lean-bulking. Hidden from the user.
 */
export function proteinTarget(p: Profile): number {
  const perKg = p.goal === 'fat' ? 2.2 : 1.9
  return Math.round(p.weight * perKg)
}

/** Local calendar date as YYYY-MM-DD (not UTC — avoids late-night date shifts). */
export const todayISO = (d = new Date()): string => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function mealsOn(meals: Meal[], date: string): Meal[] {
  return meals.filter((m) => m.date === date)
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

export interface ScoreBreakdown {
  score: number
  hasData: boolean
  mealQuality: number
  proteinPct: number
  proteinGrams: number
  proteinTarget: number
  mealsLogged: number
}

/**
 * Daily Achilles Score (0–100) from today's logged meals.
 *   50% — quality of what you ate (avg meal score)
 *   35% — hitting your protein target
 *   15% — logging consistency (≈3 meals)
 */
export function dailyScore(meals: Meal[], profile: Profile, date = todayISO()): ScoreBreakdown {
  const today = mealsOn(meals, date)
  const target = proteinTarget(profile)
  const proteinGrams = Math.round(today.reduce((s, m) => s + (m.macros?.protein ?? 0), 0))
  const proteinPct = clamp01(proteinGrams / target)
  const mealQuality = today.length ? today.reduce((s, m) => s + m.score, 0) / today.length : 0
  const logging = clamp01(today.length / 3)

  const score = Math.round(0.5 * mealQuality + 0.35 * proteinPct * 100 + 0.15 * logging * 100)

  return {
    score,
    hasData: today.length > 0,
    mealQuality: Math.round(mealQuality),
    proteinPct: Math.round(proteinPct * 100),
    proteinGrams,
    proteinTarget: target,
    mealsLogged: today.length,
  }
}

/** % of the last 7 days (incl. today) with at least one meal logged. */
export function weeklyAdherence(meals: Meal[], date = todayISO()): number {
  // Work in local time and format each day with the same local helper as todayISO.
  const base = new Date(date + 'T12:00:00')
  let logged = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    if (mealsOn(meals, todayISO(d)).length > 0) logged++
  }
  return Math.round((logged / 7) * 100)
}

export interface Trend {
  hasData: boolean
  /** Latest check-in, if any. */
  latest?: Checkin
  /** Weight delta vs previous check-in (kg). Negative = lost weight. */
  weightDelta?: number
  waistDelta?: number
  /** True when the trend moves toward the user's goal. */
  onTrack: boolean
}

/** Compare the two most recent check-ins to derive the body trend. */
export function bodyTrend(checkins: Checkin[], goal: Profile['goal']): Trend {
  if (checkins.length === 0) return { hasData: false, onTrack: false }
  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const prev = sorted[1]
  if (!prev) return { hasData: true, latest, onTrack: true }

  const weightDelta = +(latest.weightKg - prev.weightKg).toFixed(1)
  const waistDelta = +(latest.waistCm - prev.waistCm).toFixed(1)
  // Fat goal → want weight/waist down; muscle goal → want weight up.
  const onTrack = goal === 'fat' ? weightDelta <= 0 : weightDelta >= 0

  return { hasData: true, latest, weightDelta, waistDelta, onTrack }
}

/* ============================================================
   Evolution — the long-range view across ALL check-ins.
   Powers the elegant progress chart (thin lines + % change).
   ============================================================ */

export interface EvolutionMetric {
  /** Points in chronological order (oldest → newest). */
  series: { date: string; value: number }[]
  first: number
  last: number
  /** Signed change last − first (kg / cm). Negative = went down. */
  absChange: number
  /** Signed percentage change vs the first measurement. */
  pctChange: number
  firstDate: string
  lastDate: string
}

export interface Evolution {
  hasData: boolean
  /** Number of check-ins. */
  count: number
  /** Whole weeks spanned between first and last measurement. */
  weeks: number
  weight?: EvolutionMetric
  waist?: EvolutionMetric
}

function buildMetric(points: Checkin[], pick: (c: Checkin) => number): EvolutionMetric | undefined {
  if (points.length < 2) return undefined
  const series = points.map((c) => ({ date: c.date, value: pick(c) }))
  const first = series[0].value
  const last = series[series.length - 1].value
  const absChange = +(last - first).toFixed(1)
  const pctChange = first ? +(((last - first) / first) * 100).toFixed(1) : 0
  return {
    series,
    first,
    last,
    absChange,
    pctChange,
    firstDate: series[0].date,
    lastDate: series[series.length - 1].date,
  }
}

/** Build the full evolution view from all check-ins (sorted oldest → newest). */
export function progressEvolution(checkins: Checkin[]): Evolution {
  const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) return { hasData: false, count: 0, weeks: 0 }

  const first = new Date(sorted[0].date + 'T12:00:00')
  const last = new Date(sorted[sorted.length - 1].date + 'T12:00:00')
  const weeks = Math.max(1, Math.round((last.getTime() - first.getTime()) / (7 * 864e5)))

  return {
    hasData: true,
    count: sorted.length,
    weeks,
    weight: buildMetric(sorted, (c) => c.weightKg),
    waist: buildMetric(sorted, (c) => c.waistCm),
  }
}

/**
 * A warm, motivating one-liner based on how the weight is moving relative
 * to the user's goal. Keeps the Achilles tone: steady, no hype.
 */
export function motivationalLine(evo: Evolution, goal: Profile['goal']): string {
  const w = evo.weight
  if (!w) return 'Tu segundo check-in dibujará la primera línea de tu evolución.'
  const pct = w.pctChange // negative = lost weight
  const down = Math.abs(pct)

  if (goal === 'fat') {
    if (pct <= -3) return `Transformación en marcha: −${down}% de peso. Así se forja el físico de Aquiles.`
    if (pct <= -1) return 'Progreso sólido y sostenible. Bajas sin prisa pero sin pausa: el cuerpo lo nota.'
    if (pct < 0) return 'Tendencia a la baja. Despacio y firme — la constancia siempre gana.'
    if (pct === 0) return 'Semana estable. Ajusta un detalle y volverás a moverte hacia tu objetivo.'
    return 'Pequeño repunte. No es un fallo, es información: vuelve al plan y sigue.'
  }
  // muscle
  if (pct >= 3) return `Construyendo masa: +${down}% de peso con control. Vas en la dirección correcta.`
  if (pct >= 1) return 'Subida limpia y progresiva. Estás ganando músculo de calidad.'
  if (pct > 0) return 'Tendencia al alza, suave y sostenida. Buen trabajo: mantén el estímulo.'
  if (pct === 0) return 'Semana estable. Un pequeño extra de comida y volverás a subir.'
  return 'Bajada puntual. Asegura proteína y calorías esta semana y retoma la línea.'
}

/** Short Spanish date label, e.g. "19 jun". */
export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    .format(new Date(iso + 'T12:00:00'))
    .replace('.', '')
}

/** Trend headline shown on the Progress screen. */
export function trendText(trend: Trend, goal: Profile['goal']): string {
  if (!trend.hasData) return 'Registra tu primer check-in para ver tu tendencia.'
  if (trend.weightDelta === undefined) return 'Primer registro guardado. La tendencia aparece con el segundo.'
  if (trend.onTrack) {
    return goal === 'fat'
      ? 'Bajando de forma estable. Mantén el ritmo: vas en la dirección correcta.'
      : 'Subiendo de forma controlada. Vas construyendo masa de calidad.'
  }
  return 'Esta semana no se movió como esperabas. Ajusta detalles y sigue constante.'
}
