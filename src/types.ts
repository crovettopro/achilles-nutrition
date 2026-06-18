/* Shared domain types for Achilles Nutrition */

export type Goal = 'fat' | 'muscle'
export type Activity = 'low' | 'mid' | 'high'
export type WeekendPlan = 'lunch' | 'dinner'

export interface Profile {
  goal: Goal
  age: number
  weight: number
  height: number
  activity: Activity
}

export interface Macros {
  protein: number
  carbs: number
  fat: number
  kcal: number
}

export interface Meal {
  id: string
  name: string
  time: string
  /** ISO date (YYYY-MM-DD) the meal was logged. */
  date: string
  score: number
  macros: Macros
}

/** A weekly body check-in (the "seguimiento semanal"). */
export interface Checkin {
  id: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  weightKg: number
  waistCm: number
  /** Steps logged for the week (manual entry). */
  steps: number
  /** Optional progress photo as a data URL. */
  photo?: string
}

/** Result of analysing a food photo / description. */
export interface FoodAnalysis {
  name: string
  score: number
  /** Qualitative factors shown to the user. `positive: false` renders the ⚠ warning style. */
  factors: { label: string; positive: boolean }[]
  /** Macros — hidden by default in the UI unless `showMacros` is on. */
  macros: Macros
}

/** Result of analysing a restaurant menu. */
export interface MenuAnalysis {
  /** The single best recommendation phrased as a sentence. */
  bestOption: string
  /** Things to avoid. */
  avoid: string[]
}

export type ChatRole = 'ai' | 'me'
export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
}
