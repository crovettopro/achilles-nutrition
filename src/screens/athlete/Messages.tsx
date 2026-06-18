import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import Chat from '../../components/Chat'

/** Athlete's chat with their linked coach. */
export default function Messages() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { coachId } = useApp()

  if (!user) return null
  if (!coachId) {
    navigate('/account', { replace: true })
    return null
  }
  return (
    <Chat
      meId={user.id}
      otherId={coachId}
      title="Tu preparador"
      onBack={() => navigate('/home')}
    />
  )
}
