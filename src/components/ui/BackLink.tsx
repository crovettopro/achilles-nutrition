import { useNavigate } from 'react-router-dom'
import styles from './BackLink.module.css'

/** "← Inicio" back link used on the Restaurant and Weekend screens. */
export default function BackLink({ to = '/home', label = 'Inicio' }: { to?: string; label?: string }) {
  const navigate = useNavigate()
  return (
    <button className={styles.back} onClick={() => navigate(to)}>
      ← {label}
    </button>
  )
}
