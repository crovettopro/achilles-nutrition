import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { analyzeFood, analyzeMenu, coachReply, weekendStrategy } from './minimax.js'
import { initDb } from './db.js'
import { registerRoutes } from './routes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Seed/load the store (file-backed locally, in-memory on Vercel).
initDb()

const app = express()
// Photos arrive as base64 data URLs → allow a generous JSON body.
app.use(express.json({ limit: '12mb' }))

/** Wrap an async AI handler with uniform error handling. */
const handler = (fn) => async (req, res) => {
  try {
    res.json(await fn(req.body ?? {}))
  } catch (err) {
    console.error('[ai]', err.message)
    res.status(502).json({ error: 'ai_failed', message: 'No se pudo completar el análisis.' })
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: process.env.MINIMAX_API_KEY ? 'minimax' : 'unconfigured' })
})

// Auth / athlete data / coach / messaging
registerRoutes(app)

app.post('/api/ai/food', handler(analyzeFood))
app.post('/api/ai/menu', handler(analyzeMenu))
app.post('/api/ai/weekend', handler(async (body) => ({ strategy: await weekendStrategy(body) })))
app.post('/api/ai/coach', handler(async (body) => ({ reply: await coachReply(body) })))

// Local production (`npm start`): serve the built SPA from the same origin.
// On Vercel the static files are served by the platform, not Express.
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const dist = join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))
}

export default app
