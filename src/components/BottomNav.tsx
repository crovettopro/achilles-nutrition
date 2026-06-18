import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

const ITEMS = [
  { to: '/home', label: 'Inicio' },
  { to: '/scan', label: 'Escanear' },
  { to: '/progress', label: 'Progreso' },
  { to: '/coach', label: 'Coach' },
] as const

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.label}>{item.label}</span>
          <span className={styles.dot} />
        </NavLink>
      ))}
    </nav>
  )
}
