import app from './app.js'

// Local / persistent-host entrypoint. On Vercel the app is imported by
// api/index.js instead (serverless), so we don't listen there.
const PORT = process.env.PORT || 8787
app.listen(PORT, () => {
  console.log(`Achilles API listening on http://localhost:${PORT}`)
  if (!process.env.MINIMAX_API_KEY) {
    console.warn('⚠  MINIMAX_API_KEY not set — /api/ai/* will return 502.')
  }
})
