export default function handler(_req, res) {
  res.status(200).json({ ok: true, ai: process.env.MINIMAX_API_KEY ? 'minimax' : 'unconfigured' })
}
