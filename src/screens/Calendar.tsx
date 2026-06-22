import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import BackLink from '../components/ui/BackLink'
import MonthCalendar from '../components/MonthCalendar'
import styles from './Calendar.module.css'

export default function Calendar() {
  const navigate = useNavigate()
  const { meals, profile } = useApp()

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to="/home" label="Inicio" />
      <h2 className={styles.title}>Historial</h2>
      <p className={styles.subtitle}>Toca un día para revisarlo o registrar el pasado.</p>

      <MonthCalendar meals={meals} profile={profile} onSelectDate={(d) => navigate(`/day/${d}`)} />
    </div>
  )
}
