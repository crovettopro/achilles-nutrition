import type { ChatMessage, FoodAnalysis, MenuAnalysis, Profile, WeekendPlan } from '../../types'
import type { AIService, AlcoholInput, FoodInput, MenuInput } from './types'

/**
 * Talks to our own backend (`/api/ai/*`), which holds the MiniMax key
 * server-side. This is the production-safe provider — no API key in the bundle.
 */
export class BackendAIService implements AIService {
  constructor(private readonly base = '/api') {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}))
      throw new Error(detail?.message ?? `Request failed: ${res.status}`)
    }
    return res.json() as Promise<T>
  }

  analyzeFood(input: FoodInput): Promise<FoodAnalysis> {
    return this.post('/ai/food', input)
  }

  analyzeMenu(input: MenuInput): Promise<MenuAnalysis> {
    return this.post('/ai/menu', input)
  }

  async weekendStrategy(plan: WeekendPlan, profile: Profile): Promise<string> {
    const { strategy } = await this.post<{ strategy: string }>('/ai/weekend', { plan, profile })
    return strategy
  }

  async alcoholStrategy(input: AlcoholInput, profile: Profile): Promise<string> {
    const { strategy } = await this.post<{ strategy: string }>('/ai/alcohol', { ...input, profile })
    return strategy
  }

  async coachReply(history: ChatMessage[], profile: Profile): Promise<string> {
    const { reply } = await this.post<{ reply: string }>('/ai/coach', { history, profile })
    return reply
  }
}
