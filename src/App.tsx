import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Onboarding from './screens/Onboarding/Onboarding'
import Home from './screens/Home'
import Scan from './screens/Scan'
import Restaurant from './screens/Restaurant'
import Weekend from './screens/Weekend'
import Progress from './screens/Progress'
import Coach from './screens/Coach'
import { useApp } from './context/AppContext'
import styles from './App.module.css'

export default function App() {
  const { onboardingDone } = useApp()
  return (
    <div className={styles.app}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />}
        />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Screens with the bottom navigation */}
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/restaurant" element={<Restaurant />} />
          <Route path="/weekend" element={<Weekend />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/coach" element={<Coach />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}
