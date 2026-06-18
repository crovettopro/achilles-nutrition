import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message } from '../types'
import { api } from './api'

/** Loads and polls a conversation with `otherId`, and exposes send(). */
export function useMessages(otherId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval>>()

  const fetchOnce = useCallback(async () => {
    if (!otherId) return
    try {
      const { messages } = await api<{ messages: Message[] }>(`/messages/${otherId}`)
      setMessages(messages)
    } catch {
      /* ignore transient errors */
    } finally {
      setLoading(false)
    }
  }, [otherId])

  useEffect(() => {
    if (!otherId) return
    setLoading(true)
    void fetchOnce()
    timer.current = setInterval(fetchOnce, 4000)
    return () => clearInterval(timer.current)
  }, [otherId, fetchOnce])

  const send = useCallback(
    async (text: string) => {
      if (!otherId || !text.trim()) return
      const { message } = await api<{ message: Message }>('/messages', {
        method: 'POST',
        body: { toId: otherId, text: text.trim() },
      })
      setMessages((prev) => [...prev, message])
    },
    [otherId],
  )

  return { messages, loading, send, refresh: fetchOnce }
}
