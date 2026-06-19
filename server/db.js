import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { supabase, hasSupabase } from './supabase.js'

/**
 * Supabase Postgres-backed store. Durable on Vercel (unlike the old file/
 * in-memory store). All access goes through the SERVICE_ROLE client in
 * server/supabase.js. Every function is async.
 *
 * Run server/schema.sql once in the Supabase SQL editor before first use.
 */

function shortCode() {
  return 'ACH-' + randomUUID().slice(0, 4).toUpperCase()
}

/** DB row (snake_case) → app user shape (camelCase) used across the server. */
function rowToUser(r) {
  if (!r) return null
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    role: r.role,
    name: r.name,
    coachCode: r.coach_code ?? undefined,
    coachId: r.coach_id ?? undefined,
    createdAt: r.created_at,
  }
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

/** Verify Supabase config, then guarantee the demo accounts exist. */
export async function initDb() {
  if (!hasSupabase) {
    throw new Error(
      'Supabase no configurado: define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.',
    )
  }
  await ensureDemoUsers()
}

function todayLocalISO() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

/** Idempotently create/repair the two fixed demo accounts and their data. */
async function ensureDemoUsers() {
  const hash = bcrypt.hashSync('aquilles123', 10)

  // Coach: upsert keeps the id, email, code and password stable.
  await supabase.from('users').upsert(
    {
      id: DEMO_COACH.id,
      email: DEMO_COACH.email,
      password_hash: hash,
      role: 'coach',
      name: DEMO_COACH.name,
      coach_code: DEMO_COACH.coachCode,
    },
    { onConflict: 'id' },
  )

  // Athlete: only seed profile/meals/checkins the FIRST time (don't clobber
  // real data the demo user may have logged since).
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', DEMO_ATHLETE.id)
    .maybeSingle()
  const firstTime = !existing

  await supabase.from('users').upsert(
    {
      id: DEMO_ATHLETE.id,
      email: DEMO_ATHLETE.email,
      password_hash: hash,
      role: 'athlete',
      name: DEMO_ATHLETE.name,
      coach_id: DEMO_COACH.id, // pre-linked
    },
    { onConflict: 'id' },
  )

  if (firstTime) {
    const today = todayLocalISO()
    await supabase.from('profiles').upsert({
      user_id: DEMO_ATHLETE.id,
      goal: 'fat',
      age: 32,
      weight: 82,
      height: 180,
      activity: 'mid',
      onboarded: true,
    })
    await supabase.from('meals').upsert({
      user_id: DEMO_ATHLETE.id,
      items: [
        { id: randomUUID(), name: 'Tortilla de claras y café', time: '08:20', date: today, score: 84, macros: { protein: 30, carbs: 8, fat: 12, kcal: 280 } },
        { id: randomUUID(), name: 'Pollo a la plancha, arroz y aguacate', time: '13:40', date: today, score: 92, macros: { protein: 48, carbs: 62, fat: 18, kcal: 610 } },
        { id: randomUUID(), name: 'Salmón con espárragos', time: '20:15', date: today, score: 95, macros: { protein: 40, carbs: 10, fat: 22, kcal: 420 } },
      ],
    })
    await supabase.from('checkins').upsert({
      user_id: DEMO_ATHLETE.id,
      items: [{ id: randomUUID(), date: today, weightKg: 81.4, waistCm: 84, steps: 11400 }],
    })
  }

  console.log(`Demo accounts ready (Supabase). Coach invite code: ${DEMO_COACH.coachCode}`)
}

/* ---------- Users ---------- */
export async function findUserByEmail(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .ilike('email', String(email))
    .maybeSingle()
  return rowToUser(data)
}

export async function findUserById(id) {
  const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  return rowToUser(data)
}

export async function findCoachByCode(code) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'coach')
    .eq('coach_code', String(code).trim().toUpperCase())
    .maybeSingle()
  return rowToUser(data)
}

export async function createUser({ email, passwordHash, role, name }) {
  const id = randomUUID()
  const row = {
    id,
    email,
    password_hash: passwordHash,
    role,
    name,
    ...(role === 'coach' ? { coach_code: shortCode() } : {}),
  }
  const { data, error } = await supabase.from('users').insert(row).select('*').single()
  if (error) throw new Error(`createUser: ${error.message}`)

  if (role === 'athlete') {
    await supabase.from('profiles').upsert({
      user_id: id,
      goal: 'fat',
      age: 30,
      weight: 80,
      height: 178,
      activity: 'mid',
      onboarded: false,
    })
    await supabase.from('meals').upsert({ user_id: id, items: [] })
    await supabase.from('checkins').upsert({ user_id: id, items: [] })
  }
  return rowToUser(data)
}

export async function linkAthleteToCoach(athleteId, coachId) {
  const { data } = await supabase
    .from('users')
    .update({ coach_id: coachId })
    .eq('id', athleteId)
    .select('*')
    .maybeSingle()
  return rowToUser(data)
}

/* ---------- Athlete data ---------- */
export async function getProfile(uid) {
  const { data } = await supabase
    .from('profiles')
    .select('goal, age, weight, height, activity, onboarded')
    .eq('user_id', uid)
    .maybeSingle()
  return data ?? null
}

export async function setProfile(uid, profile) {
  await supabase.from('profiles').upsert({
    user_id: uid,
    goal: profile?.goal ?? null,
    age: profile?.age ?? null,
    weight: profile?.weight ?? null,
    height: profile?.height ?? null,
    activity: profile?.activity ?? null,
    onboarded: profile?.onboarded ?? false,
  })
}

export async function getMeals(uid) {
  const { data } = await supabase.from('meals').select('items').eq('user_id', uid).maybeSingle()
  return data?.items ?? []
}

export async function setMeals(uid, meals) {
  await supabase.from('meals').upsert({ user_id: uid, items: Array.isArray(meals) ? meals : [] })
}

export async function getCheckins(uid) {
  const { data } = await supabase.from('checkins').select('items').eq('user_id', uid).maybeSingle()
  return data?.items ?? []
}

export async function setCheckins(uid, checkins) {
  await supabase
    .from('checkins')
    .upsert({ user_id: uid, items: Array.isArray(checkins) ? checkins : [] })
}

/* ---------- Coach ---------- */
export async function athletesOfCoach(coachId) {
  const { data } = await supabase.from('users').select('*').eq('coach_id', coachId)
  return (data ?? []).map(rowToUser)
}

/* ---------- Messages ---------- */
export async function conversation(a, b) {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`and(from_id.eq.${a},to_id.eq.${b}),and(from_id.eq.${b},to_id.eq.${a})`)
    .order('created_at', { ascending: true })
  return (data ?? []).map((m) => ({
    id: m.id,
    fromId: m.from_id,
    toId: m.to_id,
    text: m.text,
    createdAt: m.created_at,
  }))
}

export async function addMessage({ fromId, toId, text }) {
  const row = { id: randomUUID(), from_id: fromId, to_id: toId, text }
  const { data, error } = await supabase.from('messages').insert(row).select('*').single()
  if (error) throw new Error(`addMessage: ${error.message}`)
  return { id: data.id, fromId: data.from_id, toId: data.to_id, text: data.text, createdAt: data.created_at }
}

/** Public view of a user (no password hash). Pure mapping — stays sync. */
export const publicUser = (u) =>
  u && {
    id: u.id,
    email: u.email,
    role: u.role,
    name: u.name,
    coachCode: u.coachCode,
    coachId: u.coachId,
  }
