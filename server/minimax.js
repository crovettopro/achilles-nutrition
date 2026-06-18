import { FOOD_ANALYSIS_PROMPT, MENU_ANALYSIS_PROMPT, PHILOSOPHY } from './prompts.js'
import { normalizeFood, normalizeMenu } from './validate.js'

/**
 * Server-side MiniMax client. Holds the API key (never sent to the browser)
 * and calls the MiniMax endpoint directly (no CORS server-side).
 */

const cfg = () => ({
  apiKey: process.env.MINIMAX_API_KEY,
  groupId: process.env.MINIMAX_GROUP_ID,
  baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.chat',
  model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
  visionModel: process.env.MINIMAX_VISION_MODEL || 'MiniMax-Text-01',
})

async function chat(messages, model) {
  const c = cfg()
  if (!c.apiKey) throw new Error('MINIMAX_API_KEY not configured on the server')
  const url = `${c.baseUrl.replace(/\/$/, '')}/v1/text/chatcompletion_v2${
    c.groupId ? `?GroupId=${encodeURIComponent(c.groupId)}` : ''
  }`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({
      model: model || c.model,
      messages,
      temperature: 0.4,
      max_tokens: 4096,
    }),
  })
  if (!res.ok) throw new Error(`MiniMax ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('MiniMax returned no content')
  return content
}

function userTurn(text, image) {
  if (!image) return { role: 'user', content: text }
  return {
    role: 'user',
    content: [
      { type: 'text', text },
      { type: 'image_url', image_url: { url: image } },
    ],
  }
}

function parseJSON(raw) {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`No JSON found in response: ${raw}`)
  return JSON.parse(match[0])
}

export async function analyzeFood({ image, text }) {
  const prompt = text ? `Comida descrita por el usuario: "${text}".` : 'Analiza la comida de la foto.'
  const model = image ? cfg().visionModel : cfg().model
  const raw = await chat(
    [{ role: 'system', content: FOOD_ANALYSIS_PROMPT }, userTurn(prompt, image)],
    model,
  )
  return normalizeFood(parseJSON(raw))
}

export async function analyzeMenu({ image }) {
  const model = image ? cfg().visionModel : cfg().model
  const raw = await chat(
    [
      { role: 'system', content: MENU_ANALYSIS_PROMPT },
      userTurn('Analiza esta carta de restaurante.', image),
    ],
    model,
  )
  return normalizeMenu(parseJSON(raw))
}

export async function weekendStrategy({ plan, profile }) {
  const meal = plan === 'lunch' ? 'comer fuera (comida)' : 'cenar fuera (cena)'
  const goal = profile?.goal === 'muscle' ? 'ganar músculo limpio' : 'perder grasa'
  const raw = await chat([
    { role: 'system', content: PHILOSOPHY },
    {
      role: 'user',
      content: `Hoy voy a ${meal}. Mi objetivo es ${goal}. Dame una estrategia de una o dos frases para el resto del día. Solo el texto, sin preámbulos.`,
    },
  ])
  return raw.trim()
}

export async function coachReply({ history, profile }) {
  const goal = profile?.goal === 'muscle' ? 'ganar músculo limpio' : 'perder grasa'
  const turns = [
    {
      role: 'system',
      content: `${PHILOSOPHY}\n\nContexto del usuario: objetivo ${goal}, ${profile?.age ?? '?'} años, ${profile?.weight ?? '?'} kg, ${profile?.height ?? '?'} cm.`,
    },
    ...(Array.isArray(history) ? history : []).map((m) => ({
      role: m.role === 'me' ? 'user' : 'assistant',
      content: String(m.text ?? ''),
    })),
  ]
  const raw = await chat(turns)
  return raw.trim()
}
