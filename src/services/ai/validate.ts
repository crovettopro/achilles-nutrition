import type { FoodAnalysis, MenuAnalysis } from '../../types'

/**
 * Normalize raw LLM JSON into safe domain objects. LLMs occasionally omit
 * fields or return wrong types; rather than crash the UI at render time, we
 * coerce to valid shapes with sane fallbacks.
 */

function toNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

function clampScore(v: unknown): number {
  return Math.max(0, Math.min(100, Math.round(toNumber(v, 0))))
}

export function normalizeFood(raw: unknown): FoodAnalysis {
  const o = (raw ?? {}) as Record<string, unknown>

  const factorsRaw = Array.isArray(o.factors) ? o.factors : []
  const factors = factorsRaw
    .map((f) => {
      const fo = (f ?? {}) as Record<string, unknown>
      return { label: String(fo.label ?? '').trim(), positive: fo.positive !== false }
    })
    .filter((f) => f.label.length > 0)

  const macrosRaw = (o.macros ?? {}) as Record<string, unknown>

  return {
    name: String(o.name ?? 'Comida').trim() || 'Comida',
    score: clampScore(o.score),
    factors: factors.length > 0 ? factors : [{ label: 'Análisis completado', positive: true }],
    macros: {
      protein: toNumber(macrosRaw.protein, 0),
      carbs: toNumber(macrosRaw.carbs, 0),
      fat: toNumber(macrosRaw.fat, 0),
      kcal: toNumber(macrosRaw.kcal, 0),
    },
  }
}

export function normalizeMenu(raw: unknown): MenuAnalysis {
  const o = (raw ?? {}) as Record<string, unknown>
  const avoid = (Array.isArray(o.avoid) ? o.avoid : [])
    .map((x) => String(x ?? '').trim())
    .filter((x) => x.length > 0)

  return {
    bestOption: String(o.bestOption ?? '').trim() || 'Elige la opción más proteica y natural.',
    avoid: avoid.length > 0 ? avoid : ['Salsas', 'Bebidas azucaradas', 'Postres'],
  }
}
