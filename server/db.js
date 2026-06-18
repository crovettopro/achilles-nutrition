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

const empty = () => ({ users: [], profiles: {}, meals: {}, checkins: {}, messages: [] })

let db = empty()

function persist() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function shortCode() {
  return 'ACH-' + randomUUID().slice(0, 4).toUpperCase()
}

/** Load existing DB or seed a fresh one with the two demo accounts. */
export function initDb() {
  if (existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, 'utf8'))
      return
    } catch {
      db = empty()
    }
  }

  const hash = (p) => bcrypt.hashSync(p, 10)
  const coachId = randomUUID()
  const athleteId = randomUUID()
  const coachCode = shortCode()

  db = empty()
  db.users.push({
    id: coachId,
    email: 'alejandrodiosfdz@gmail.com',
    passwordHash: hash('aquilles123'),
    role: 'coach',
    name: 'Alejandro',
    coachCode,
    createdAt: new Date().toISOString(),
  })
  db.users.push({
    id: athleteId,
    email: 'crovettopro@gmail.com',
    passwordHash: hash('aquilles123'),
    role: 'athlete',
    name: 'Crovetto',
    coachId, // pre-linked to the demo coach so the dashboard isn't empty
    createdAt: new Date().toISOString(),
  })
  // Sensible starting profile for the athlete (already onboarded for the demo).
  db.profiles[athleteId] = { goal: 'fat', age: 32, weight: 82, height: 180, activity: 'mid', onboarded: true }
  db.meals[athleteId] = []
  db.checkins[athleteId] = []
  persist()
  console.log(`Seeded users. Coach invite code: ${coachCode}`)
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
