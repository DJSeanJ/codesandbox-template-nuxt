import type { ChatMessage } from '~~/shared/types'

interface UiMessage extends ChatMessage {
  streaming?: boolean
}

export const useChatMessages = () => useState<UiMessage[]>('chat-messages', () => [])
export const useChatStreaming = () => useState<boolean>('chat-streaming', () => false)

interface SseFrame {
  event: string
  data: unknown
}

function parseFrame(raw: string): SseFrame | null {
  let event = 'message'
  let dataLine = ''
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLine += line.slice(5).trim()
  }
  if (!dataLine) return null
  try {
    return { event, data: JSON.parse(dataLine) }
  } catch {
    return { event, data: dataLine }
  }
}

export function useChat() {
  const messages = useChatMessages()
  const streaming = useChatStreaming()
  const session = useSession()
  const revealed = useRevealedTracks()
  const mood = useWorldMood()
  const completed = useCompletedChapters()
  const ended = useSessionEnded()
  const farewell = useFarewell()
  const showSupport = useShowSupport()

  function applyEvent(frame: SseFrame, assistantBuffer: { text: string }) {
    const data = frame.data as Record<string, unknown>
    switch (frame.event) {
      case 'session':
        if (typeof data.sessionId === 'string') session.setId(data.sessionId)
        break
      case 'text_delta':
        if (typeof data.text === 'string') {
          assistantBuffer.text += data.text
          const last = messages.value[messages.value.length - 1]
          if (last && last.role === 'assistant' && last.streaming) {
            last.content = assistantBuffer.text
          }
        }
        break
      case 'tool_use':
        // surfaced internally; UI doesn't need to render these
        break
      case 'track_revealed':
        if (typeof data.trackId === 'string') revealed.add(data.trackId)
        break
      case 'mood_changed':
        if (typeof data.mood === 'string') mood.value = data.mood
        break
      case 'chapter_completed':
        if (typeof data.chapterId === 'string') {
          if (!completed.value.includes(data.chapterId)) {
            completed.value = [...completed.value, data.chapterId]
          }
        }
        break
      case 'support_resources':
        showSupport.value = true
        break
      case 'session_ended':
        ended.value = true
        if (typeof data.farewell === 'string') farewell.value = data.farewell
        break
      case 'error':
        // eslint-disable-next-line no-console
        console.warn('chat error', data)
        break
      case 'done':
        // handled by stream end
        break
    }
  }

  async function send(text: string) {
    if (streaming.value) return
    const trimmed = text.trim()
    if (!trimmed) return

    const sessionId = await session.ensure()

    messages.value = [
      ...messages.value,
      { role: 'user', content: trimmed, ts: Date.now() },
      { role: 'assistant', content: '', ts: Date.now(), streaming: true },
    ]
    streaming.value = true

    const buffer = { text: '' }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: trimmed }),
      })
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let pending = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        pending += decoder.decode(value, { stream: true })
        let idx = pending.indexOf('\n\n')
        while (idx !== -1) {
          const block = pending.slice(0, idx)
          pending = pending.slice(idx + 2)
          const frame = parseFrame(block)
          if (frame) applyEvent(frame, buffer)
          idx = pending.indexOf('\n\n')
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('chat stream failed', err)
    } finally {
      const last = messages.value[messages.value.length - 1]
      if (last && last.streaming) {
        last.streaming = false
        last.content = buffer.text || last.content
      }
      streaming.value = false
    }
  }

  async function hydrateFromServer() {
    const id = (await session.ensure().catch(() => null)) ?? null
    if (!id) return
    try {
      const data = await $fetch<{
        revealedTracks: string[]
        completedChapters: string[]
        currentMood: string
        endedAt: number | null
        history: ChatMessage[]
      }>(`/api/session?id=${encodeURIComponent(id)}`)
      revealed.setAll(data.revealedTracks)
      completed.value = [...data.completedChapters]
      mood.value = data.currentMood
      ended.value = !!data.endedAt
      messages.value = data.history.map((m) => ({ ...m }))
    } catch {
      // 404 or stale id — leave current state
    }
  }

  return { messages, streaming, send, hydrateFromServer }
}
