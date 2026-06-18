import { useEffect, useRef, useState } from 'react'
import { useMessages } from '../lib/useMessages'
import styles from './Chat.module.css'

/**
 * Human-to-human chat (coach ↔ athlete). `meId` decides which bubbles are mine.
 */
export default function Chat({
  meId,
  otherId,
  title,
  subtitle,
  onBack,
}: {
  meId: string
  otherId: string
  title: string
  subtitle?: string
  onBack?: () => void
}) {
  const { messages, loading, send } = useMessages(otherId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    try {
      await send(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        {onBack && (
          <button className={styles.back} onClick={onBack} aria-label="Volver">
            ←
          </button>
        )}
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>

      <div className={styles.messages}>
        {!loading && messages.length === 0 && (
          <div className={styles.empty}>Aún no hay mensajes. Escribe el primero.</div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.bubble} ${m.fromId === meId ? styles.me : styles.them}`}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className={styles.inputBar} onSubmit={submit}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
        />
        <button className={styles.sendBtn} type="submit" aria-label="Enviar" disabled={sending}>
          ↑
        </button>
      </form>
    </div>
  )
}
