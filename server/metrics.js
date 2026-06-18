/** Server-side port of the score/adherence calcs (for the coach dashboard). */

const ACTIVITY_FACTOR = { low: 1.375, mid: 1.55, high: 1.725 }
const clamp01 = (n) => Math.max(0, Math.min(1, n))

export const todayISO = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export function proteinTarget(p) {
  if (!p) return 150
  const perKg = p.goal === 'fat' ? 2.2 : 1.9
  return Math.round((p.weight || 80) * perKg)
}

const mealsOn = (meals, date) => meals.filter((m) => m.date === date)

export function dailyScore(meals, profile, date = todayISO()) {
  const today = mealsOn(meals, date)
  const target = proteinTarget(profile)
  const protein = Math.round(today.reduce((s, m) => s + (m.macros?.protein ?? 0), 0))
  const proteinPct = clamp01(protein / target)
  const quality = today.length ? today.reduce((s, m) => s + m.score, 0) / today.length : 0
  const logging = clamp01(today.length / 3)
  return {
    score: Math.round(0.5 * quality + 0.35 * proteinPct * 100 + 0.15 * logging * 100),
    hasData: today.length > 0,
    mealsToday: today.length,
  }
}

export function weeklyAdherence(meals, date = todayISO()) {
  const base = new Date(date + 'T12:00:00')
  let logged = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    if (mealsOn(meals, todayISO(d)).length > 0) logged++
  }
  return Math.round((logged / 7) * 100)
}

// eslint-disable-next-line no-unused-vars
export function lastActivity(meals, checkins) {
  const dates = [...meals.map((m) => m.date), ...checkins.map((c) => c.date)].sort()
  return dates.length ? dates[dates.length - 1] : null
}
