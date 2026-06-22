import bcrypt from 'bcryptjs'
import { requireAuth, requireRole, signToken } from './auth.js'
import * as db from './db.js'
import { dailyScore, lastActivity, weeklyAdherence } from './metrics.js'

/** Wrap an async route so any thrown/rejected error becomes a 500 (not a hang). */
const route = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error('[route]', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'server_error' })
  })

/** Register all auth / data / coach / messaging routes on the Express app. */
export function registerRoutes(app) {
  /* ---------------- Auth ---------------- */
  app.post('/api/auth/signup', route(async (req, res) => {
    const { email, password, role, name, inviteCode } = req.body ?? {}
    if (!email || !password || !name) return res.status(400).json({ error: 'missing_fields' })
    if (!['athlete', 'coach'].includes(role)) return res.status(400).json({ error: 'bad_role' })
    if (await db.findUserByEmail(email)) return res.status(409).json({ error: 'email_taken' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.createUser({ email, passwordHash, role, name })

    // Athletes may link to a coach right away via invite code.
    if (role === 'athlete' && inviteCode) {
      const coach = await db.findCoachByCode(inviteCode)
      if (coach) await db.linkAthleteToCoach(user.id, coach.id)
    }
    res.json({ token: signToken(user), user: db.publicUser(await db.findUserById(user.id)) })
  }))

  app.post('/api/auth/login', route(async (req, res) => {
    const { email, password } = req.body ?? {}
    const user = await db.findUserByEmail(email || '')
    if (!user) return res.status(401).json({ error: 'bad_credentials' })
    const ok = await bcrypt.compare(password || '', user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'bad_credentials' })
    res.json({ token: signToken(user), user: db.publicUser(user) })
  }))

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: db.publicUser(req.user) })
  })

  /* ---------------- Athlete data ---------------- */
  app.get('/api/me/data', requireAuth, route(async (req, res) => {
    const uid = req.user.id
    const [profile, meals, checkins, alcohol] = await Promise.all([
      db.getProfile(uid),
      db.getMeals(uid),
      db.getCheckins(uid),
      db.getAlcohol(uid),
    ])
    res.json({ profile, meals, checkins, alcohol, coachId: req.user.coachId ?? null })
  }))

  app.put('/api/me/profile', requireAuth, route(async (req, res) => {
    await db.setProfile(req.user.id, req.body ?? {})
    res.json({ ok: true })
  }))

  app.put('/api/me/meals', requireAuth, route(async (req, res) => {
    await db.setMeals(req.user.id, Array.isArray(req.body?.meals) ? req.body.meals : [])
    res.json({ ok: true })
  }))

  app.put('/api/me/checkins', requireAuth, route(async (req, res) => {
    await db.setCheckins(req.user.id, Array.isArray(req.body?.checkins) ? req.body.checkins : [])
    res.json({ ok: true })
  }))

  app.put('/api/me/alcohol', requireAuth, route(async (req, res) => {
    await db.setAlcohol(req.user.id, Array.isArray(req.body?.alcohol) ? req.body.alcohol : [])
    res.json({ ok: true })
  }))

  app.post('/api/me/link', requireAuth, route(async (req, res) => {
    const coach = await db.findCoachByCode(req.body?.code || '')
    if (!coach) return res.status(404).json({ error: 'coach_not_found' })
    await db.linkAthleteToCoach(req.user.id, coach.id)
    res.json({ ok: true, coach: db.publicUser(coach) })
  }))

  /* ---------------- Coach ---------------- */
  app.get('/api/coach/me', requireAuth, requireRole('coach'), (req, res) => {
    res.json({ coachCode: req.user.coachCode })
  })

  app.get('/api/coach/athletes', requireAuth, requireRole('coach'), route(async (req, res) => {
    const list = await db.athletesOfCoach(req.user.id)
    const athletes = await Promise.all(
      list.map(async (a) => {
        const [meals, checkins, profile] = await Promise.all([
          db.getMeals(a.id),
          db.getCheckins(a.id),
          db.getProfile(a.id),
        ])
        const { score, hasData } = dailyScore(meals, profile)
        return {
          id: a.id,
          name: a.name,
          email: a.email,
          goal: profile?.goal ?? null,
          score: hasData ? score : null,
          adherence: weeklyAdherence(meals),
          lastActivity: lastActivity(meals, checkins),
          mealsToday: meals.length,
        }
      }),
    )
    res.json({ athletes })
  }))

  app.get('/api/coach/athletes/:id', requireAuth, requireRole('coach'), route(async (req, res) => {
    const athlete = await db.findUserById(req.params.id)
    if (!athlete || athlete.coachId !== req.user.id)
      return res.status(404).json({ error: 'not_found' })
    const [profile, meals, checkins, alcohol] = await Promise.all([
      db.getProfile(athlete.id),
      db.getMeals(athlete.id),
      db.getCheckins(athlete.id),
      db.getAlcohol(athlete.id),
    ])
    res.json({ athlete: db.publicUser(athlete), profile, meals, checkins, alcohol })
  }))

  /* ---------------- Messaging ---------------- */
  // Conversation with another user (athlete↔coach). Auth required; only the
  // two linked parties may talk.
  async function canTalk(me, otherId) {
    const other = await db.findUserById(otherId)
    if (!other) return false
    if (me.role === 'athlete') return me.coachId === other.id
    if (me.role === 'coach') return other.coachId === me.id
    return false
  }

  app.get('/api/messages/:otherId', requireAuth, route(async (req, res) => {
    if (!(await canTalk(req.user, req.params.otherId)))
      return res.status(403).json({ error: 'forbidden' })
    res.json({ messages: await db.conversation(req.user.id, req.params.otherId) })
  }))

  app.post('/api/messages', requireAuth, route(async (req, res) => {
    const { toId, text } = req.body ?? {}
    if (!text?.trim()) return res.status(400).json({ error: 'empty' })
    if (!(await canTalk(req.user, toId))) return res.status(403).json({ error: 'forbidden' })
    res.json({ message: await db.addMessage({ fromId: req.user.id, toId, text: text.trim() }) })
  }))
}
