// Vercel serverless entry: the whole Express app as one function.
// vercel.json rewrites /api/* here. Data is in-memory on Vercel (see server/db.js).
import app from '../server/app.js'

export default app
