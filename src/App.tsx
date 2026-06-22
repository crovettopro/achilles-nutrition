import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import AppShell from './components/AppShell'
import Login from './screens/auth/Login'
import Onboarding from './screens/Onboarding/Onboarding'
import Home from './screens/Home'
import Day from './screens/Day'
import CalendarScreen from './screens/Calendar'
import Scan from './screens/Scan'
import Restaurant from './screens/Restaurant'
import Weekend from './screens/Weekend'
import Progress from './screens/Progress'
import Coach from './screens/Coach'
import Account from './screens/athlete/Account'
import Messages from './screens/athlete/Messages'
import CoachHome from './screens/coach/CoachHome'
import CoachAthlete from './screens/coach/CoachAthlete'
import CoachChat from './screens/coach/CoachChat'
import styles from './App.module.css'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className={styles.app} style={{ background: '#0A0A0A' }} />
  }

  return (
    <div className={styles.app}>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : user.role === 'coach' ? (
        <Routes>
          <Route path="/coach" element={<CoachHome />} />
          <Route path="/coach/athlete/:id" element={<CoachAthlete />} />
          <Route path="/coach/chat/:id" element={<CoachChat />} />
          <Route path="*" element={<Navigate to="/coach" replace />} />
        </Routes>
      ) : (
        <AppProvider>
          <AthleteRoutes />
        </AppProvider>
      )}
    </div>
  )
}

function AthleteRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/messages" element={<Messages />} />
      <Route element={<AppShell />}>
        <Route path="/home" element={<Home />} />
        <Route path="/day/:date" element={<Day />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/restaurant" element={<Restaurant />} />
        <Route path="/weekend" element={<Weekend />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/account" element={<Account />} />
      </Route>
      <Route path="*" element={<AthleteRedirect />} />
    </Routes>
  )
}

function AthleteRedirect() {
  const { onboardingDone } = useApp()
  return <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />
}
