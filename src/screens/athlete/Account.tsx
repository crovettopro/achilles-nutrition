import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import Button from '../../components/ui/Button'
import BackLink from '../../components/ui/BackLink'
import { api, ApiError } from '../../lib/api'
import styles from './Account.module.css'

export default function Account() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { coachId, reloadCoach } = useApp()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const link = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/me/link', { method: 'POST', body: { code: code.trim() } })
      await reloadCoach()
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'coach_not_found'
          ? 'No existe ningún preparador con ese código.'
          : 'No se pudo vincular. Inténtalo de nuevo.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink to="/home" label="Inicio" />
      <h2 className={styles.title}>Tu cuenta</h2>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Nombre</span>
          <span className={styles.value}>{user?.name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <span className={styles.value}>{user?.email}</span>
        </div>
      </div>

      <div className={styles.sectionTitle}>Tu preparador</div>
      {coachId ? (
        <div className={styles.linkedCard}>
          <div className={styles.linkedText}>Estás vinculado a tu preparador.</div>
          <Button onClick={() => navigate('/messages')}>Mensajes con tu preparador</Button>
        </div>
      ) : (
        <form className={styles.card} onSubmit={link}>
          <p className={styles.hint}>
            Introduce el código de tu preparador para que pueda seguir tu progreso y escribirte.
          </p>
          <input
            className={styles.input}
            placeholder="Código (p. ej. ACH-1234)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            aria-label="Código de preparador"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? 'Vinculando…' : 'Vincular'}
          </Button>
        </form>
      )}

      <button className={styles.logout} onClick={logout}>
        Cerrar sesión
      </button>
    </div>
  )
}
