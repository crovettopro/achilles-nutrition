/* Shared domain types for Achilles Nutrition */

export type Goal = 'fat' | 'muscle'
export type Activity = 'low' | 'mid' | 'high'
export type WeekendPlan = 'lunch' | 'dinner'

export type Role = 'athlete' | 'coach'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  coachCode?: string
  coachId?: string | null
}

/** A human-to-human message (coach ↔ athlete). */
export interface Message {
  id: string
  fromId: string
  toId: string
  text: string
  createdAt: string
}

export interface Profile {
  goal: Goal
  age: number
  weight: number
  height: number
  activity: Activity
  /** Whether the athlete finished onboarding (server-tracked). */
  onboarded?: boolean
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

/** A logged drinking occasion. Its calories are subtracted from NEXT day's target. */
export interface AlcoholLog {
  id: string
  /** ISO date (YYYY-MM-DD) the drinking happened. */
  date: string
  /** What they drank. */
  kind: 'wine_beer' | 'spirits'
  /** Approx. number of drinks (for spirits). */
  drinks: number
  /** Estimated calories of the session. */
  kcal: number
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

export interface FoodIngredient {
  name: string
  weight: number
  prep: string
  calories: number
}

/** Result of analysing a food photo / description. */
export interface FoodAnalysis {
  name: string
  score: number
  /** Qualitative factors shown to the user. `positive: false` renders the ⚠ warning style. */
  factors: { label: string; positive: boolean }[]
  macros: Macros
  /** Estimated total calories (same as macros.kcal). */
  calories?: number
  /** Model confidence 0–100. */
  confidence?: number
  /** Short visual reasoning behind the estimate. */
  reasoning?: string
  /** Per-ingredient breakdown. */
  ingredients?: FoodIngredient[]
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
