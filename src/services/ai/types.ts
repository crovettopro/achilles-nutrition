import type {
  ChatMessage,
  FoodAnalysis,
  MenuAnalysis,
  Profile,
  WeekendPlan,
} from '../../types'

export interface FoodInput {
  /** Data URL of the captured photo, if any. */
  image?: string
  /** Free-text description (method 2: registro por texto). */
  text?: string
}

export interface MenuInput {
  image?: string
}

/**
 * Provider-agnostic AI gateway for Achilles Nutrition.
 *
 * Every method embodies the "Achilles philosophy": minimal friction, protein
 * first, no calorie obsession. Swap the implementation (mock / MiniMax / Claude)
 * behind this interface without touching the UI.
 */
export interface AIService {
  /** Analyse a food photo or text description → score + qualitative factors + macros. */
  analyzeFood(input: FoodInput): Promise<FoodAnalysis>
  /** Analyse a restaurant menu photo → best option + things to avoid. */
  analyzeMenu(input: MenuInput): Promise<MenuAnalysis>
  /** Generate a weekend-eating strategy for the user's plan. */
  weekendStrategy(plan: WeekendPlan, profile: Profile): Promise<string>
  /** Generate a smart-drinking strategy (Alcohol Mode). */
  alcoholStrategy(input: AlcoholInput, profile: Profile): Promise<string>
  /** Reply to the user in the coach chat. */
  coachReply(history: ChatMessage[], profile: Profile): Promise<string>
}

export interface AlcoholInput {
  /** wine_beer = solo vino/cerveza; spirits = copas. */
  kind: 'wine_beer' | 'spirits'
  /** Approx. number of drinks when kind = spirits. */
  drinks?: number
}
