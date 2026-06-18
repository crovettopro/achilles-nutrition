import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import styles from './AppShell.module.css'

/**
 * Mobile app shell: a full-height column capped at --app-max on desktop,
 * with a scrollable content area and a fixed bottom navigation.
 */
export default function AppShell() {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
