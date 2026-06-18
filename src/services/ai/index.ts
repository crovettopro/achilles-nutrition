import type { AIService } from './types'
import { MockAIService } from './mock'
import { MiniMaxAIService } from './minimax'
import { BackendAIService } from './backend'

export type { AIService, FoodInput, MenuInput } from './types'

/**
 * Select the AI provider from environment:
 *   backend (default) — calls our Node server (/api/ai/*), key stays server-side.
 *   mock              — fully offline, simulated responses.
 *   minimax           — legacy: calls MiniMax directly from the browser (exposes key).
 */
function createAIService(): AIService {
  const provider = (import.meta.env.VITE_AI_PROVIDER ?? 'backend').toLowerCase()

  if (provider === 'mock') return new MockAIService()

  if (provider === 'minimax') {
    const apiKey = import.meta.env.VITE_MINIMAX_API_KEY as string | undefined
    if (!apiKey) {
      console.warn('[ai] VITE_AI_PROVIDER=minimax but no API key set — falling back to mock.')
      return new MockAIService()
    }
    return new MiniMaxAIService({
      apiKey,
      groupId: import.meta.env.VITE_MINIMAX_GROUP_ID as string | undefined,
      baseUrl: (import.meta.env.VITE_MINIMAX_BASE_URL as string) ?? '/minimax',
      model: (import.meta.env.VITE_MINIMAX_MODEL as string) ?? 'MiniMax-M2.7',
      visionModel: (import.meta.env.VITE_MINIMAX_VISION_MODEL as string) ?? 'MiniMax-Text-01',
    })
  }

  // Default: our backend proxy.
  return new BackendAIService((import.meta.env.VITE_API_BASE as string) ?? '/api')
}

/** Singleton AI gateway used across the app. */
export const ai: AIService = createAIService()
