import bcrypt from 'bcryptjs'
import { requireAuth, requireRole, signToken } from './auth.js'
import * as db from './db.js'
import { dailyScore, lastActivity, weeklyAdherence } from './metrics.js'

/** Register all auth / data / coach / messaging routes on the Express app. */
export function registerRoutes(app) {
  /* ---------------- Auth ---------------- */
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, role, name, inviteCode } = req.body ?? {}
    if (!email || !password || !name) return res.status(400).json({ error: 'missing_fields' })
    if (!['athlete', 'coach'].includes(role)) return res.status(400).json({ error: 'bad_role' })
    if (db.findUserByEmail(email)) return res.status(409).json({ error: 'email_taken' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = db.createUser({ email, passwordHash, role, name })

    // Athletes may link to a coach right away via invite code.
    if (role === 'athlete' && inviteCode) {
      const coach = db.findCoachByCode(inviteCode)
      if (coach) db.linkAthleteToCoach(user.id, coach.id)
    }
    res.json({ token: signToken(user), user: db.publicUser(db.findUserById(user.id)) })
  })

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body ?? {}
    const user = db.findUserByEmail(email || '')
    if (!user) return res.status(401).json({ error: 'bad_credentials' })
    const ok = await bcrypt.compare(password || '', user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'bad_credentials' })
    res.json({ token: signToken(user), user: db.publicUser(user) })
  })

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: db.publicUser(req.user) })
  })

  /* ---------------- Athlete data ---------------- */
  app.get('/api/me/data', requireAuth, (req, res) => {
    const uid = req.user.id
    res.json({
      profile: db.getProfile(uid),
      meals: db.getMeals(uid),
      checkins: db.getCheckins(uid),
      coachId: req.user.coachId ?? null,
    })
  })

  app.put('/api/me/profile', requireAuth, (req, res) => {
    db.setProfile(req.user.id, req.body ?? {})
    res.json({ ok: true })
  })

  app.put('/api/me/meals', requireAuth, (req, res) => {
    db.setMeals(req.user.id, Array.isArray(req.body?.meals) ? req.body.meals : [])
    res.json({ ok: true })
  })

  app.put('/api/me/checkins', requireAuth, (req, res) => {
    db.setCheckins(req.user.id, Array.isArray(req.body?.checkins) ? req.body.checkins : [])
    res.json({ ok: true })
  })

  app.post('/api/me/link', requireAuth, (req, res) => {
    const coach = db.findCoachByCode(req.body?.code || '')
    if (!coach) return res.status(404).json({ error: 'coach_not_found' })
    db.linkAthleteToCoach(req.user.id, coach.id)
    res.json({ ok: true, coach: db.publicUser(coach) })
  })

  /* ---------------- Coach ---------------- */
  app.get('/api/coach/me', requireAuth, requireRole('coach'), (req, res) => {
    res.json({ coachCode: req.user.coachCode })
  })

  app.get('/api/coach/athletes', requireAuth, requireRole('coach'), (req, res) => {
    const athletes = db.athletesOfCoach(req.user.id).map((a) => {
      const meals = db.getMeals(a.id)
      const checkins = db.getCheckins(a.id)
      const profile = db.getProfile(a.id)
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
    })
    res.json({ athletes })
  })

  app.get('/api/coach/athletes/:id', requireAuth, requireRole('coach'), (req, res) => {
    const athlete = db.findUserById(req.params.id)
    if (!athlete || athlete.coachId !== req.user.id)
      return res.status(404).json({ error: 'not_found' })
    res.json({
      athlete: db.publicUser(athlete),
      profile: db.getProfile(athlete.id),
      meals: db.getMeals(athlete.id),
      checkins: db.getCheckins(athlete.id),
    })
  })

  /* ---------------- Messaging ---------------- */
  // Conversation with another user (athlete↔coach). Auth required; only the
  // two linked parties may talk.
  function canTalk(me, otherId) {
    const other = db.findUserById(otherId)
    if (!other) return false
    if (me.role === 'athlete') return me.coachId === other.id
    if (me.role === 'coach') return other.coachId === me.id
    return false
  }

  app.get('/api/messages/:otherId', requireAuth, (req, res) => {
    if (!canTalk(req.user, req.params.otherId)) return res.status(403).json({ error: 'forbidden' })
    res.json({ messages: db.conversation(req.user.id, req.params.otherId) })
  })

  app.post('/api/messages', requireAuth, (req, res) => {
    const { toId, text } = req.body ?? {}
    if (!text?.trim()) return res.status(400).json({ error: 'empty' })
    if (!canTalk(req.user, toId)) return res.status(403).json({ error: 'forbidden' })
    res.json({ message: db.addMessage({ fromId: req.user.id, toId, text: text.trim() }) })
  })
}
