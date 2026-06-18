import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import styles from './Coach.module.css'

const SUGGESTIONS = ['¿Puedo comer esto?', '¿Qué pido aquí?', '¿Cómo llego a mi proteína?']

export default function Coach() {
  const { chat, profile, addChatMessage } = useApp()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, sending])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setInput('')
    const userMsg = addChatMessage('me', trimmed)
    setSending(true)
    try {
      const reply = await ai.coachReply([...chat, userMsg], profile)
      addChatMessage('ai', reply)
    } catch (err) {
      console.error(err)
      addChatMessage('ai', 'Ahora mismo no puedo responder. Inténtalo de nuevo en un momento.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>IA Coach</h2>
      </div>

      <div className={styles.messages}>
        {chat.map((m) => (
          <div
            key={m.id}
            className={`${styles.bubble} ${m.role === 'me' ? styles.me : styles.aiMsg}`}
          >
            {m.text}
          </div>
        ))}
        {sending && <div className={`${styles.bubble} ${styles.aiMsg} ${styles.typing}`}>…</div>}
        <div ref={endRef} />
      </div>

      <div className={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className={styles.chip} onClick={() => send(s)} disabled={sending}>
            {s}
          </button>
        ))}
      </div>

      <form
        className={styles.inputBar}
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe a tu coach…"
          aria-label="Mensaje al coach"
        />
        <button className={styles.sendBtn} type="submit" aria-label="Enviar" disabled={sending}>
          ↑
        </button>
      </form>
    </div>
  )
}
