import type { Goal } from '../types'

export const RING_RADIUS = 72
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ≈ 452.4

/** SVG stroke-dashoffset for a given score (0–100) on the Achilles ring. */
export function scoreDashoffset(score: number): number {
  const clamped = Math.max(0, Math.min(100, score))
  return RING_CIRCUMFERENCE * (1 - clamped / 100)
}

/** Status pill copy driven by the score. */
export function statusText(score: number): string {
  if (score >= 85) return 'Vas por buen camino'
  if (score >= 70) return 'Vas bien, ajusta detalles'
  return 'Necesitas más constancia'
}

/** Human label for a goal. */
export function goalLabel(goal: Goal): string {
  return goal === 'fat' ? 'Perder grasa' : 'Ganar músculo limpio'
}

/** Today's date, formatted like "Martes, 17 de junio". */
export function formatToday(date = new Date()): string {
  const s = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Long label for an ISO date, e.g. "Lunes, 16 de junio" (noon-anchored). */
export function formatLongDate(iso: string): string {
  return formatToday(new Date(iso + 'T12:00:00'))
}

/** Accent color for a score: gold (great), brass (ok), stone (weak). */
export function scoreTone(score: number, hasData = true): string {
  if (!hasData) return 'var(--text-3)'
  if (score >= 85) return 'var(--gold)'
  if (score >= 70) return '#c9b079'
  return 'var(--text-2)'
}
