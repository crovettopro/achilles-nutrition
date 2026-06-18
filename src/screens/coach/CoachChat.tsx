import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Chat from '../../components/Chat'
import type { AuthUser } from '../../types'

export default function CoachChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('Alumno')

  useEffect(() => {
    api<{ athlete: AuthUser }>(`/coach/athletes/${id}`)
      .then((d) => setName(d.athlete.name))
      .catch(() => {})
  }, [id])

  if (!user || !id) return null
  return (
    <Chat
      meId={user.id}
      otherId={id}
      title={name}
      subtitle="Alumno"
      onBack={() => navigate(`/coach/athlete/${id}`)}
    />
  )
}
