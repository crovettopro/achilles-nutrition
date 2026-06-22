import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Activity, AlcoholLog, Checkin, ChatMessage, Goal, Macros, Meal, Profile } from '../types'
import { COACH_INTRO } from '../data/demo'
import { api } from '../lib/api'
import { clampPast, mealScoreFromMacros, todayISO } from '../lib/metrics'

let idSeq = 0
const nextId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${++idSeq}`

/** Local wall-clock time as HH:MM (es-ES, 24h). */
const nowTime = () =>
  new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date())

/** Options for logging a meal to a specific (past) day. */
export interface MealOpts {
  date?: string
  time?: string
}

interface AppContextValue {
  profile: Profile
  onboardingDone: boolean
  showMacros: boolean
  meals: Meal[]
  checkins: Checkin[]
  alcohol: AlcoholLog[]
  chat: ChatMessage[]
  coachId: string | null
  setGoal: (goal: Goal) => void
  setActivity: (activity: Activity) => void
  stepProfile: (field: 'age' | 'weight' | 'height', delta: number) => void
  completeOnboarding: () => void
  /** Log a meal. Defaults to today; pass opts.date to log retroactively. Returns the created meal. */
  addMeal: (meal: { name: string; score: number; macros: Macros }, opts?: MealOpts) => Meal
  /** Patch a logged meal; if macros change the score is recomputed. */
  updateMeal: (id: string, patch: Partial<Pick<Meal, 'name' | 'time' | 'macros'>>) => void
  /** Delete a logged meal. */
  removeMeal: (id: string) => void
  /** Re-insert a previously removed meal verbatim (for undo). */
  restoreMeal: (meal: Meal) => void
  /** Clone a meal to another day (default today). Returns the clone. */
  duplicateMeal: (id: string, toDate?: string) => Meal | null
  addCheckin: (checkin: Omit<Checkin, 'id' | 'date'>) => void
  addAlcohol: (log: Omit<AlcoholLog, 'id' | 'date'>) => void
  addChatMessage: (role: ChatMessage['role'], text: string) => ChatMessage
  reloadCoach: () => Promise<void>
}

const DEFAULT_PROFILE: Profile = {
  goal: 'fat',
  age: 32,
  weight: 82,
  height: 180,
  activity: 'mid',
  onboarded: false,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [meals, setMeals] = useState<Meal[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [alcohol, setAlcohol] = useState<AlcoholLog[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([{ id: nextId(), role: 'ai', text: COACH_INTRO }])
  const [loaded, setLoaded] = useState(false)
  const [showMacros] = useState(false)

  // Load the athlete's data from the server on mount.
  useEffect(() => {
    api<{
      profile: Profile | null
      meals: Meal[]
      checkins: Checkin[]
      alcohol: AlcoholLog[]
      coachId: string | null
    }>('/me/data')
      .then((d) => {
        if (d.profile) setProfile({ ...DEFAULT_PROFILE, ...d.profile })
        setMeals(Array.isArray(d.meals) ? d.meals : [])
        setCheckins(Array.isArray(d.checkins) ? d.checkins : [])
        setAlcohol(Array.isArray(d.alcohol) ? d.alcohol : [])
        setCoachId(d.coachId ?? null)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Keep the latest profile in a ref so we can persist it without stale closures.
  const profileRef = useRef(profile)
  profileRef.current = profile
  const saveProfile = useCallback((p: Profile) => {
    void api('/me/profile', { method: 'PUT', body: p }).catch(() => {})
  }, [])

  const setGoal = useCallback((goal: Goal) => setProfile((p) => ({ ...p, goal })), [])
  const setActivity = useCallback(
    (activity: Activity) => setProfile((p) => ({ ...p, activity })),
    [],
  )
  const stepProfile = useCallback(
    (field: 'age' | 'weight' | 'height', delta: number) =>
      setProfile((p) => ({ ...p, [field]: Math.max(0, p[field] + delta) })),
    [],
  )

  const completeOnboarding = useCallback(() => {
    const updated = { ...profileRef.current, onboarded: true }
    setProfile(updated)
    saveProfile(updated)
  }, [saveProfile])

  // Serialize whole-array PUTs so rapid back-fill / edit / delete can't race
  // and clobber each other (last-write-wins on the server).
  const mealsWrite = useRef<Promise<unknown>>(Promise.resolve())
  const persistMeals = useCallback((next: Meal[]) => {
    mealsWrite.current = mealsWrite.current.then(() =>
      api('/me/meals', { method: 'PUT', body: { meals: next } }).catch(() => {}),
    )
  }, [])

  const addMeal = useCallback(
    (meal: { name: string; score: number; macros: Macros }, opts?: MealOpts): Meal => {
      const date = clampPast(opts?.date ?? todayISO())
      const time = opts?.time ?? (date === todayISO() ? nowTime() : '—')
      const created: Meal = { ...meal, id: nextId(), date, time }
      setMeals((prev) => {
        const next = [created, ...prev]
        persistMeals(next)
        return next
      })
      return created
    },
    [persistMeals],
  )

  const updateMeal = useCallback(
    (id: string, patch: Partial<Pick<Meal, 'name' | 'time' | 'macros'>>) => {
      setMeals((prev) => {
        const next = prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...patch,
                ...(patch.macros ? { macros: patch.macros, score: mealScoreFromMacros(patch.macros) } : {}),
              }
            : m,
        )
        persistMeals(next)
        return next
      })
    },
    [persistMeals],
  )

  const removeMeal = useCallback(
    (id: string) => {
      setMeals((prev) => {
        const next = prev.filter((m) => m.id !== id)
        persistMeals(next)
        return next
      })
    },
    [persistMeals],
  )

  const restoreMeal = useCallback(
    (meal: Meal) => {
      setMeals((prev) => {
        if (prev.some((m) => m.id === meal.id)) return prev
        const next = [meal, ...prev]
        persistMeals(next)
        return next
      })
    },
    [persistMeals],
  )

  const duplicateMeal = useCallback(
    (id: string, toDate?: string): Meal | null => {
      let clone: Meal | null = null
      setMeals((prev) => {
        const src = prev.find((m) => m.id === id)
        if (!src) return prev
        const date = clampPast(toDate ?? todayISO())
        clone = { ...src, id: nextId(), date, time: date === todayISO() ? nowTime() : src.time }
        const next = [clone, ...prev]
        persistMeals(next)
        return next
      })
      return clone
    },
    [persistMeals],
  )

  const addCheckin = useCallback((checkin: Omit<Checkin, 'id' | 'date'>) => {
    setCheckins((prev) => {
      const next = [{ ...checkin, id: nextId(), date: todayISO() }, ...prev]
      void api('/me/checkins', { method: 'PUT', body: { checkins: next } }).catch(() => {})
      return next
    })
  }, [])

  const addAlcohol = useCallback((log: Omit<AlcoholLog, 'id' | 'date'>) => {
    setAlcohol((prev) => {
      const next = [{ ...log, id: nextId(), date: todayISO() }, ...prev]
      void api('/me/alcohol', { method: 'PUT', body: { alcohol: next } }).catch(() => {})
      return next
    })
  }, [])

  const addChatMessage = useCallback((role: ChatMessage['role'], text: string) => {
    const msg: ChatMessage = { id: nextId(), role, text }
    setChat((prev) => [...prev, msg])
    return msg
  }, [])

  const reloadCoach = useCallback(async () => {
    const d = await api<{ coachId: string | null }>('/me/data')
    setCoachId(d.coachId ?? null)
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      onboardingDone: !!profile.onboarded,
      showMacros,
      meals,
      checkins,
      alcohol,
      chat,
      coachId,
      setGoal,
      setActivity,
      stepProfile,
      completeOnboarding,
      addMeal,
      updateMeal,
      removeMeal,
      restoreMeal,
      duplicateMeal,
      addCheckin,
      addAlcohol,
      addChatMessage,
      reloadCoach,
    }),
    [
      profile,
      showMacros,
      meals,
      checkins,
      alcohol,
      chat,
      coachId,
      setGoal,
      setActivity,
      stepProfile,
      completeOnboarding,
      addMeal,
      updateMeal,
      removeMeal,
      restoreMeal,
      duplicateMeal,
      addCheckin,
      addAlcohol,
      addChatMessage,
      reloadCoach,
    ],
  )

  if (!loaded) return <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} />

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
