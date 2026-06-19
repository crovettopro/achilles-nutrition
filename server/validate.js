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

const isFried = (prep) => /frit|reboz|empan|crujient/i.test(prep || '')

/** Per-meal Aquiles score (0–100) derived from macros: protein density up, very fatty/fried down. */
function mealScore({ protein, fat, kcal }, ingredients) {
  if (!kcal) return 60
  const protRatio = (protein * 4) / kcal
  const fatRatio = (fat * 9) / kcal
  const fried = ingredients.some((i) => isFried(i.prep))
  const s = 50 + protRatio * 120 - Math.max(0, fatRatio - 0.4) * 70 - (fried ? 8 : 0)
  return Math.max(0, Math.min(100, Math.round(s)))
}

/** Qualitative factors shown on the scan result. */
function mealFactors({ protein, fat, kcal }, ingredients) {
  const out = []
  const protRatio = kcal ? (protein * 4) / kcal : 0
  if (protRatio >= 0.28) out.push({ label: 'Proteína alta', positive: true })
  else if (protRatio >= 0.18) out.push({ label: 'Proteína moderada', positive: true })
  else out.push({ label: 'Falta proteína', positive: false })

  out.push({ label: `≈ ${kcal} kcal estimadas`, positive: true })

  const fried = ingredients.some((i) => isFried(i.prep))
  const fatRatio = kcal ? (fat * 9) / kcal : 0
  if (fried || fatRatio > 0.45) out.push({ label: 'Grasas de cocción detectadas', positive: false })
  else out.push({ label: 'Alimentos naturales', positive: true })

  return out
}

/** Normalize the expert vision JSON into the app's FoodAnalysis shape. */
export function normalizeFoodVision(raw) {
  const o = raw ?? {}
  const m = o.macros ?? {}
  const protein = toNumber(m.protein_g, 0)
  const carbs = toNumber(m.carbs_g, 0)
  const fat = toNumber(m.fats_g, 0)
  const kcal = toNumber(o.total_calories, 0) || Math.round(protein * 4 + carbs * 4 + fat * 9)
  const macros = { protein, carbs, fat, kcal }

  const ingredients = (Array.isArray(o.ingredients) ? o.ingredients : [])
    .map((i) => ({
      name: String((i ?? {}).name ?? '').trim(),
      weight: toNumber((i ?? {}).estimated_weight_g, 0),
      prep: String((i ?? {}).preparation_method ?? '').trim(),
      calories: toNumber((i ?? {}).calories, 0),
    }))
    .filter((i) => i.name)

  const name = String(o.dish_name ?? '').trim() || ingredients[0]?.name || 'Comida'

  return {
    name,
    score: mealScore(macros, ingredients),
    factors: mealFactors(macros, ingredients),
    macros,
    calories: kcal,
    confidence: Math.max(0, Math.min(100, Math.round(toNumber(o.confidence_score_percent, 0)))),
    reasoning: String(o.visual_reasoning ?? '').trim(),
    ingredients,
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
