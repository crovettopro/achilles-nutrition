import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import { ApiError } from '../../lib/api'
import type { Role } from '../../types'
import styles from './Login.module.css'

type Mode = 'login' | 'signup'

const ERROR_MSG: Record<string, string> = {
  bad_credentials: 'Email o contraseña incorrectos.',
  email_taken: 'Ese email ya está registrado.',
  missing_fields: 'Completa todos los campos.',
  coach_not_found: 'No existe ningún preparador con ese código.',
}

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('athlete')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await signup({
          email: email.trim(),
          password,
          name: name.trim(),
          role,
          inviteCode: role === 'athlete' && inviteCode.trim() ? inviteCode.trim() : undefined,
        })
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'error'
      setError(ERROR_MSG[code] ?? 'Algo salió mal. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={`${styles.inner} ach-fade`}>
        <div className={styles.brand}>
          <div className={styles.monogram}>ATC</div>
          <h1 className={styles.wordmark}>AQUILES</h1>
        </div>

        <p className={styles.subtitle}>
          {mode === 'login' ? 'La forma más simple de comer bien.' : 'Crea tu cuenta.'}
        </p>

        <form onSubmit={submit} className={styles.form}>
          {mode === 'signup' && (
            <>
              <div className={styles.roleRow}>
                <button
                  type="button"
                  className={styles.roleBtn}
                  data-selected={role === 'athlete'}
                  onClick={() => setRole('athlete')}
                >
                  Deportista
                </button>
                <button
                  type="button"
                  className={styles.roleBtn}
                  data-selected={role === 'coach'}
                  onClick={() => setRole('coach')}
                >
                  Preparador
                </button>
              </div>
              <input
                className={styles.input}
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Nombre"
              />
            </>
          )}

          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            autoCapitalize="none"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Contraseña"
          />

          {mode === 'signup' && role === 'athlete' && (
            <input
              className={styles.input}
              placeholder="Código de preparador (opcional)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              aria-label="Código de preparador"
            />
          )}

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>

        <button
          className={styles.toggle}
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError('')
          }}
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
        </button>
      </div>
    </div>
  )
}
