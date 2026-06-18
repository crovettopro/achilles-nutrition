import type { ChatMessage, FoodAnalysis, MenuAnalysis, Profile, WeekendPlan } from '../../types'
import type { AIService, FoodInput, MenuInput } from './types'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Offline mock provider. Reproduces the prototype's canned responses and
 * timings so the whole app works with no API key. Used by default.
 */
export class MockAIService implements AIService {
  async analyzeFood(input: FoodInput): Promise<FoodAnalysis> {
    await delay(1900)
    const name = input.text?.trim() || 'Pollo a la plancha, arroz y aguacate'
    return {
      name,
      score: 92,
      factors: [
        { label: 'Proteína alta', positive: true },
        { label: 'Alimentos naturales', positive: true },
        { label: 'Buena saciedad', positive: true },
        { label: 'Faltan verduras', positive: false },
      ],
      macros: { protein: 48, carbs: 62, fat: 18, kcal: 610 },
    }
  }

  async analyzeMenu(_input: MenuInput): Promise<MenuAnalysis> {
    await delay(1600)
    return {
      bestOption: 'Elige el salmón con patata asada.',
      avoid: ['Salsas', 'Bebidas azucaradas', 'Postres'],
    }
  }

  async weekendStrategy(plan: WeekendPlan, _profile: Profile): Promise<string> {
    await delay(500)
    return plan === 'lunch'
      ? 'Prioriza proteína durante el día y elimina el desayuno. Bebe agua antes de salir.'
      : 'Mantén el día ligero y rico en proteína. Reserva tus carbohidratos para la cena.'
  }

  async coachReply(history: ChatMessage[], _profile: Profile): Promise<string> {
    await delay(600)
    const last = history[history.length - 1]?.text.toLowerCase() ?? ''
    if (last.includes('pedir') || last.includes('pido') || last.includes('aquí')) {
      return 'Pide una proteína a la plancha con verduras o patata asada. Evita rebozados y postres. Agua o infusión en vez de refresco.'
    }
    if (last.includes('proteína')) {
      return 'Te falta poco. Añade una fuente de proteína magra en la cena —pescado, huevos o pollo— y lo cierras sin esfuerzo.'
    }
    return 'Si encaja con tu objetivo, sí. Prioriza la proteína y reduce salsas y bebidas azucaradas. Una ración te deja con buen margen para hoy.'
  }
}
