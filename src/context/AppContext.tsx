import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Activity, Checkin, ChatMessage, Goal, Macros, Meal, Profile } from '../types'
import { COACH_INTRO } from '../data/demo'
import { load, save } from '../lib/storage'
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
  chat: ChatMessage[]
  setGoal: (goal: Goal) => void
  setActivity: (activity: Activity) => void
  stepProfile: (field: 'age' | 'weight' | 'height', delta: number) => void
  completeOnboarding: () => void
  addMeal: (meal: { name: string; score: number; macros: Macros }) => void
  addCheckin: (checkin: Omit<Checkin, 'id' | 'date'>) => void
  addChatMessage: (role: ChatMessage['role'], text: string) => ChatMessage
}

const DEFAULT_PROFILE: Profile = {
  goal: 'fat',
  age: 32,
  weight: 82,
  height: 180,
  activity: 'mid',
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => load('profile', DEFAULT_PROFILE))
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => load('onboardingDone', false))
  const [meals, setMeals] = useState<Meal[]>(() => load<Meal[]>('meals', []))
  const [checkins, setCheckins] = useState<Checkin[]>(() => load<Checkin[]>('checkins', []))
  const [chat, setChat] = useState<ChatMessage[]>([{ id: nextId(), role: 'ai', text: COACH_INTRO }])
  // Macros stay hidden by default per the Achilles philosophy.
  const [showMacros] = useState(false)

  // Persist the durable slices.
  useEffect(() => save('profile', profile), [profile])
  useEffect(() => save('onboardingDone', onboardingDone), [onboardingDone])
  useEffect(() => save('meals', meals), [meals])
  useEffect(() => save('checkins', checkins), [checkins])

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

  const completeOnboarding = useCallback(() => setOnboardingDone(true), [])

  const addMeal = useCallback((meal: { name: string; score: number; macros: Macros }) => {
    const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(),
    )
    setMeals((prev) => [{ ...meal, id: nextId(), date: todayISO(), time }, ...prev])
  }, [])

  const addCheckin = useCallback((checkin: Omit<Checkin, 'id' | 'date'>) => {
    setCheckins((prev) => [{ ...checkin, id: nextId(), date: todayISO() }, ...prev])
  }, [])

  const addChatMessage = useCallback((role: ChatMessage['role'], text: string) => {
    const msg: ChatMessage = { id: nextId(), role, text }
    setChat((prev) => [...prev, msg])
    return msg
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      onboardingDone,
      showMacros,
      meals,
      checkins,
      chat,
      setGoal,
      setActivity,
      stepProfile,
      completeOnboarding,
      addMeal,
      addCheckin,
      addChatMessage,
    }),
    [
      profile,
      onboardingDone,
      showMacros,
      meals,
      checkins,
      chat,
      setGoal,
      setActivity,
      stepProfile,
      completeOnboarding,
      addMeal,
      addCheckin,
      addChatMessage,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
