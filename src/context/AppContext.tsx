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
import { todayISO } from '../lib/metrics'

let idSeq = 0
const nextId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${++idSeq}`

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
  addMeal: (meal: { name: string; score: number; macros: Macros }) => void
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

  const addMeal = useCallback((meal: { name: string; score: number; macros: Macros }) => {
    const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(),
    )
    setMeals((prev) => {
      const next = [{ ...meal, id: nextId(), date: todayISO(), time }, ...prev]
      void api('/me/meals', { method: 'PUT', body: { meals: next } }).catch(() => {})
      return next
    })
  }, [])

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
