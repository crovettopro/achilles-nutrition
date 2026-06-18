import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

/**
 * Tiny file-backed store. Works locally and on persistent Node hosts.
 * NOTE: not suitable for Vercel serverless (ephemeral FS) — swap this module
 * for a real Postgres client when moving the user system to production.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_FILE = join(DATA_DIR, 'db.json')

// On Vercel the filesystem is read-only/ephemeral → keep the store in memory
// (seeded with the fixed demo data). Writes live only for the instance lifetime.
const IN_MEMORY = !!process.env.VERCEL

const empty = () => ({ users: [], profiles: {}, meals: {}, checkins: {}, messages: [] })

let db = empty()

function persist() {
  if (IN_MEMORY) return
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function shortCode() {
  return 'ACH-' + randomUUID().slice(0, 4).toUpperCase()
}

// Fixed demo accounts — always present with stable ids, password and code.
const DEMO_COACH = {
  id: 'coach-alejandro',
  email: 'alejandrodiosfdz@gmail.com',
  name: 'Alejandro',
  coachCode: 'ACH-ALEX',
}
const DEMO_ATHLETE = {
  id: 'athlete-crovetto',
  email: 'crovettopro@gmail.com',
  name: 'Crovetto',
}

/** Load existing DB (or start empty), then guarantee the demo accounts exist. */
export function initDb() {
  if (!IN_MEMORY && existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, 'utf8'))
    } catch {
      db = empty()
    }
  } else {
    db = empty()
  }
  ensureDemoUsers()
}

/** Idempotently create/repair the two fixed demo accounts. */
function ensureDemoUsers() {
  const hash = bcrypt.hashSync('aquilles123', 10)

  let coach = db.users.find((u) => u.id === DEMO_COACH.id)
  if (!coach) {
    coach = {
      id: DEMO_COACH.id,
      email: DEMO_COACH.email,
      passwordHash: hash,
      role: 'coach',
      name: DEMO_COACH.name,
      coachCode: DEMO_COACH.coachCode,
      createdAt: new Date().toISOString(),
    }
    db.users.push(coach)
  } else {
    coach.coachCode = DEMO_COACH.coachCode // keep code stable
  }

  let athlete = db.users.find((u) => u.id === DEMO_ATHLETE.id)
  if (!athlete) {
    athlete = {
      id: DEMO_ATHLETE.id,
      email: DEMO_ATHLETE.email,
      passwordHash: hash,
      role: 'athlete',
      name: DEMO_ATHLETE.name,
      coachId: DEMO_COACH.id, // pre-linked
      createdAt: new Date().toISOString(),
    }
    db.users.push(athlete)
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10)
    db.profiles[athlete.id] = { goal: 'fat', age: 32, weight: 82, height: 180, activity: 'mid', onboarded: true }
    db.meals[athlete.id] = [
      { id: randomUUID(), name: 'Tortilla de claras y café', time: '08:20', date: today, score: 84, macros: { protein: 30, carbs: 8, fat: 12, kcal: 280 } },
      { id: randomUUID(), name: 'Pollo a la plancha, arroz y aguacate', time: '13:40', date: today, score: 92, macros: { protein: 48, carbs: 62, fat: 18, kcal: 610 } },
      { id: randomUUID(), name: 'Salmón con espárragos', time: '20:15', date: today, score: 95, macros: { protein: 40, carbs: 10, fat: 22, kcal: 420 } },
    ]
    db.checkins[athlete.id] = [
      { id: randomUUID(), date: today, weightKg: 81.4, waistCm: 84, steps: 11400 },
    ]
  } else {
    athlete.coachId = DEMO_COACH.id // keep the link stable
  }

  persist()
  console.log(`Demo accounts ready. Coach invite code: ${DEMO_COACH.coachCode}`)
}

/* ---------- Users ---------- */
export const findUserByEmail = (email) =>
  db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
export const findUserById = (id) => db.users.find((u) => u.id === id)
export const findCoachByCode = (code) =>
  db.users.find((u) => u.role === 'coach' && u.coachCode === String(code).trim().toUpperCase())

export function createUser({ email, passwordHash, role, name }) {
  const user = {
    id: randomUUID(),
    email,
    passwordHash,
    role,
    name,
    createdAt: new Date().toISOString(),
    ...(role === 'coach' ? { coachCode: shortCode() } : {}),
  }
  db.users.push(user)
  if (role === 'athlete') {
    db.profiles[user.id] = { goal: 'fat', age: 30, weight: 80, height: 178, activity: 'mid', onboarded: false }
    db.meals[user.id] = []
    db.checkins[user.id] = []
  }
  persist()
  return user
}

export function linkAthleteToCoach(athleteId, coachId) {
  const a = findUserById(athleteId)
  if (a) {
    a.coachId = coachId
    persist()
  }
  return a
}

/* ---------- Athlete data ---------- */
export const getProfile = (uid) => db.profiles[uid] ?? null
export function setProfile(uid, profile) {
  db.profiles[uid] = profile
  persist()
}
export const getMeals = (uid) => db.meals[uid] ?? []
export function setMeals(uid, meals) {
  db.meals[uid] = meals
  persist()
}
export const getCheckins = (uid) => db.checkins[uid] ?? []
export function setCheckins(uid, checkins) {
  db.checkins[uid] = checkins
  persist()
}

/* ---------- Coach ---------- */
export const athletesOfCoach = (coachId) => db.users.filter((u) => u.coachId === coachId)

/* ---------- Messages ---------- */
export function conversation(a, b) {
  return db.messages
    .filter(
      (m) =>
        (m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a),
    )
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
}
export function addMessage({ fromId, toId, text }) {
  const msg = { id: randomUUID(), fromId, toId, text, createdAt: new Date().toISOString() }
  db.messages.push(msg)
  persist()
  return msg
}

/** Public view of a user (no password hash). */
export const publicUser = (u) =>
  u && {
    id: u.id,
    email: u.email,
    role: u.role,
    name: u.name,
    coachCode: u.coachCode,
    coachId: u.coachId,
  }
