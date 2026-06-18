import jwt from 'jsonwebtoken'
import { findUserById } from './db.js'

const SECRET = process.env.AUTH_SECRET || 'achilles-dev-secret-change-me'
const TTL = '30d'

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: TTL })
}

/** Express middleware: require a valid Bearer token, attach req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'no_token' })
  try {
    const payload = jwt.verify(token, SECRET)
    const user = findUserById(payload.sub)
    if (!user) return res.status(401).json({ error: 'invalid_user' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

/** Require a specific role after requireAuth. */
export const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) return res.status(403).json({ error: 'forbidden' })
  next()
}
