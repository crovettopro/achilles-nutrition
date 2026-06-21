import type { ChatMessage, FoodAnalysis, MenuAnalysis, Profile, WeekendPlan } from '../../types'
import type { AIService, AlcoholInput, FoodInput, MenuInput } from './types'
import { FOOD_ANALYSIS_PROMPT, MENU_ANALYSIS_PROMPT, PHILOSOPHY } from './prompts'
import { normalizeFood, normalizeMenu } from './validate'

interface MiniMaxConfig {
  apiKey: string
  groupId?: string
  baseUrl: string
  /** Text model (reasoning) — used for chat / text-only requests. */
  model: string
  /** Vision-capable model — used whenever a request carries an image. */
  visionModel: string
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

interface ChatTurn {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

/**
 * MiniMax provider (OpenAI-compatible chat completions endpoint).
 *
 * SECURITY: calling this from the browser exposes the API key in the bundle.
 * For production, proxy these requests through a backend and drop the key here.
 * This adapter is intentionally thin so it can be repointed at that proxy by
 * changing only `baseUrl` / auth.
 */
export class MiniMaxAIService implements AIService {
  constructor(private readonly cfg: MiniMaxConfig) {}

  private async chat(messages: ChatTurn[], model = this.cfg.model): Promise<string> {
    const url = `${this.cfg.baseUrl.replace(/\/$/, '')}/v1/text/chatcompletion_v2${
      this.cfg.groupId ? `?GroupId=${encodeURIComponent(this.cfg.groupId)}` : ''
    }`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        // The reasoning text model spends tokens on hidden reasoning before the
        // answer, so keep the budget generous.
        max_tokens: 4096,
      }),
    })
    if (!res.ok) {
      throw new Error(`MiniMax request failed: ${res.status} ${await res.text()}`)
    }
    const data = await res.json()
    const content: string | undefined = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('MiniMax returned no content')
    return content
  }

  /** Build a user turn that optionally carries an image. */
  private userTurn(text: string, image?: string): ChatTurn {
    if (!image) return { role: 'user', content: text }
    return {
      role: 'user',
      content: [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: image } },
      ],
    }
  }

  /** Extract the first JSON object from a model response. */
  private parseJSON(raw: string): unknown {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error(`No JSON found in response: ${raw}`)
    return JSON.parse(match[0])
  }

  async analyzeFood(input: FoodInput): Promise<FoodAnalysis> {
    const prompt = input.text
      ? `Comida descrita por el usuario: "${input.text}".`
      : 'Analiza la comida de la foto.'
    // Image requests must go to the vision model.
    const model = input.image ? this.cfg.visionModel : this.cfg.model
    const raw = await this.chat(
      [{ role: 'system', content: FOOD_ANALYSIS_PROMPT }, this.userTurn(prompt, input.image)],
      model,
    )
    return normalizeFood(this.parseJSON(raw))
  }

  async analyzeMenu(input: MenuInput): Promise<MenuAnalysis> {
    const model = input.image ? this.cfg.visionModel : this.cfg.model
    const raw = await this.chat(
      [
        { role: 'system', content: MENU_ANALYSIS_PROMPT },
        this.userTurn('Analiza esta carta de restaurante.', input.image),
      ],
      model,
    )
    return normalizeMenu(this.parseJSON(raw))
  }

  async weekendStrategy(plan: WeekendPlan, profile: Profile): Promise<string> {
    const meal = plan === 'lunch' ? 'comer fuera (comida)' : 'cenar fuera (cena)'
    const raw = await this.chat([
      { role: 'system', content: PHILOSOPHY },
      {
        role: 'user',
        content: `Hoy voy a ${meal}. Mi objetivo es ${
          profile.goal === 'fat' ? 'perder grasa' : 'ganar músculo limpio'
        }. Dame una estrategia de una o dos frases para el resto del día. Solo el texto, sin preámbulos.`,
      },
    ])
    return raw.trim()
  }

  async alcoholStrategy(input: AlcoholInput, profile: Profile): Promise<string> {
    const what =
      input.kind === 'spirits'
        ? `voy a tomar copas (unas ${input.drinks || 'pocas'})`
        : 'voy a tomar solo vino o cerveza'
    const raw = await this.chat([
      { role: 'system', content: PHILOSOPHY },
      {
        role: 'user',
        content: `Hoy ${what}. Mi objetivo es ${
          profile.goal === 'fat' ? 'perder grasa' : 'ganar músculo limpio'
        }. Dame una estrategia de 3 o 4 frases para beber de forma inteligente hoy. Recuérdame registrar mañana lo que beba. Solo el texto, sin preámbulos.`,
      },
    ])
    return raw.trim()
  }

  async coachReply(history: ChatMessage[], profile: Profile): Promise<string> {
    const turns: ChatTurn[] = [
      {
        role: 'system',
        content: `${PHILOSOPHY}\n\nContexto del usuario: objetivo ${
          profile.goal === 'fat' ? 'perder grasa' : 'ganar músculo limpio'
        }, ${profile.age} años, ${profile.weight} kg, ${profile.height} cm.`,
      },
      ...history.map<ChatTurn>((m) => ({
        role: m.role === 'me' ? 'user' : 'assistant',
        content: m.text,
      })),
    ]
    const raw = await this.chat(turns)
    return raw.trim()
  }
}
