/**
 * Adapts our AI functions into Vercel serverless handlers.
 * Shared by the files in /api (which Vercel maps to /api/... routes).
 */
export function aiHandler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
      res.status(200).json(await fn(body))
    } catch (err) {
      console.error('[ai]', err.message)
      res.status(502).json({ error: 'ai_failed', message: 'No se pudo completar el análisis.' })
    }
  }
}
