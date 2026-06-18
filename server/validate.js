/** Normalize raw LLM JSON into safe domain objects (server-side). */

function toNumber(v, fallback) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

function clampScore(v) {
  return Math.max(0, Math.min(100, Math.round(toNumber(v, 0))))
}

export function normalizeFood(raw) {
  const o = raw ?? {}
  const factorsRaw = Array.isArray(o.factors) ? o.factors : []
  const factors = factorsRaw
    .map((f) => ({ label: String((f ?? {}).label ?? '').trim(), positive: (f ?? {}).positive !== false }))
    .filter((f) => f.label.length > 0)
  const macros = o.macros ?? {}

  return {
    name: String(o.name ?? 'Comida').trim() || 'Comida',
    score: clampScore(o.score),
    factors: factors.length > 0 ? factors : [{ label: 'Análisis completado', positive: true }],
    macros: {
      protein: toNumber(macros.protein, 0),
      carbs: toNumber(macros.carbs, 0),
      fat: toNumber(macros.fat, 0),
      kcal: toNumber(macros.kcal, 0),
    },
  }
}

export function normalizeMenu(raw) {
  const o = raw ?? {}
  const avoid = (Array.isArray(o.avoid) ? o.avoid : [])
    .map((x) => String(x ?? '').trim())
    .filter((x) => x.length > 0)

  return {
    bestOption: String(o.bestOption ?? '').trim() || 'Elige la opción más proteica y natural.',
    avoid: avoid.length > 0 ? avoid : ['Salsas', 'Bebidas azucaradas', 'Postres'],
  }
}
