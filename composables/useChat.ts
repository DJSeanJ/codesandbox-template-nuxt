import type { ChatMessage } from '~~/shared/types'

interface UiMessage extends ChatMessage {
  streaming?: boolean
}

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

export function useChat(day: Ref<number> | number) {
  const dayRef = isRef(day) ? day : ref(day)

  const messages = ref<UiMessage[]>([])
  const streaming = ref(false)

  watch(dayRef, () => {
    // Day shouldn't change inside an iframe page, but if it ever does,
    // start a fresh chat — context for the prior day no longer applies.
    messages.value = []
  })

  async function send(text: string) {
    if (streaming.value) return
    const trimmed = text.trim()
    if (!trimmed) return

    const history: ChatMessage[] = messages.value.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    messages.value = [
      ...messages.value,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '', streaming: true },
    ]
    streaming.value = true

    let buffered = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: dayRef.value,
          message: trimmed,
          history,
        }),
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
          if (!frame) {
            idx = pending.indexOf('\n\n')
            continue
          }
          if (frame.event === 'text_delta') {
            const data = frame.data as { text?: string }
            if (typeof data.text === 'string') {
              buffered += data.text
              const last = messages.value[messages.value.length - 1]
              if (last && last.role === 'assistant' && last.streaming) {
                last.content = buffered
              }
            }
          } else if (frame.event === 'error') {
            const data = frame.data as { message?: string }
            // Surface the error in the assistant bubble so the visitor sees
            // something rather than silence.
            const last = messages.value[messages.value.length - 1]
            if (last && last.role === 'assistant' && last.streaming) {
              last.content = buffered || data.message || 'something went wrong.'
            }
          }
          idx = pending.indexOf('\n\n')
        }
      }
    } catch {
      const last = messages.value[messages.value.length - 1]
      if (last && last.role === 'assistant' && last.streaming) {
        last.content = buffered || 'lost the thread for a second. try again?'
      }
    } finally {
      const last = messages.value[messages.value.length - 1]
      if (last && last.streaming) last.streaming = false
      streaming.value = false
    }
  }

  return { messages, streaming, send }
}
