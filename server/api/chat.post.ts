import type { ChatMessage, Session } from '~~/shared/types'
import {
  anthropic,
  MODEL,
  MAX_TOKENS,
  buildCachedSystemBlocks,
} from '~~/server/utils/anthropic'
import { cachedTools } from '~~/server/utils/tools'
import { ensureSession, rollingWindow, saveSession } from '~~/server/utils/storage'
import { assertRateLimit } from '~~/server/utils/rateLimit'
import { preflightUserMessage, scanOutput } from '~~/server/utils/moderation'
import { TRACKS, findTrack, findChapter } from '~~/server/prompts/tracks'

interface ChatRequestBody {
  sessionId?: string
  message: string
}

const MAX_TOOL_LOOPS = 5

export default defineEventHandler(async (event) => {
  await assertRateLimit(event)

  const body = await readBody<ChatRequestBody>(event)
  if (!body || typeof body.message !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const moderation = preflightUserMessage(body.message)
  if (!moderation.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: `Rejected: ${moderation.reason}`,
    })
  }

  const session = await ensureSession(body.sessionId)
  if (session.endedAt) {
    throw createError({ statusCode: 410, statusMessage: 'Session has ended' })
  }

  session.history.push({
    role: 'user',
    content: moderation.augmentedInput,
    ts: Date.now(),
  })

  setResponseStatus(event, 200)
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')

  const res = event.node.res
  const send = (name: string, data: unknown) => {
    res.write(`event: ${name}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  send('session', { sessionId: session.id })

  const client = anthropic()
  const systemBlocks = buildCachedSystemBlocks()
  const tools = cachedTools()

  const conversationMessages: { role: 'user' | 'assistant'; content: unknown }[] =
    rollingWindow(session.history).map((m) => ({
      role: m.role,
      content: m.content,
    }))

  try {
    for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemBlocks as never,
        tools: tools as never,
        messages: conversationMessages as never,
      })

      let textBuffer = ''
      stream.on('text', (delta: string) => {
        textBuffer += delta
        send('text_delta', { text: delta })
      })

      const finalMessage = await stream.finalMessage()

      const toolUseBlocks: { id: string; name: string; input: unknown }[] = []
      for (const block of finalMessage.content) {
        if ((block as { type: string }).type === 'tool_use') {
          const tu = block as { id: string; name: string; input: unknown }
          toolUseBlocks.push({ id: tu.id, name: tu.name, input: tu.input })
        }
      }

      if (textBuffer.trim()) {
        const scan = scanOutput(textBuffer)
        if (!scan.clean) {
          send('error', {
            message:
              'Output blocked by post-flight content scan. Please refresh the page.',
          })
          break
        }
        session.history.push({
          role: 'assistant',
          content: textBuffer,
          ts: Date.now(),
        })
      }

      if (finalMessage.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
        send('done', { stopReason: finalMessage.stop_reason ?? 'end_turn' })
        break
      }

      const toolResults: {
        type: 'tool_result'
        tool_use_id: string
        content: string
        is_error?: boolean
      }[] = []
      for (const tu of toolUseBlocks) {
        send('tool_use', { name: tu.name, input: tu.input })
        const result = await handleTool(tu.name, tu.input, session, send)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: result.content,
          is_error: result.isError ?? false,
        })
      }

      conversationMessages.push({ role: 'assistant', content: finalMessage.content })
      conversationMessages.push({ role: 'user', content: toolResults })

      if (session.endedAt) {
        send('done', { stopReason: 'session_ended' })
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    send('error', { message })
  } finally {
    await saveSession(session)
    res.end()
  }
})

async function handleTool(
  name: string,
  rawInput: unknown,
  session: Session,
  send: (name: string, data: unknown) => void,
): Promise<{ content: string; isError?: boolean }> {
  const input = (rawInput ?? {}) as Record<string, unknown>
  switch (name) {
    case 'reveal_track': {
      const trackId = String(input.track_id ?? '')
      const track = findTrack(trackId)
      if (!track) return { content: `Unknown track id: ${trackId}`, isError: true }
      if (session.revealedTracks.includes(trackId)) {
        return { content: `Already revealed: ${trackId}`, isError: true }
      }
      const remaining = TRACKS.filter(
        (t) => !session.revealedTracks.includes(t.id),
      ).sort((a, b) => a.order - b.order)
      if (remaining[0]?.id !== trackId) {
        return {
          content: `Track ${trackId} is not next in order. Next: ${remaining[0]?.id ?? 'none'}`,
          isError: true,
        }
      }
      session.revealedTracks.push(trackId)
      send('track_revealed', { trackId })
      return { content: `Revealed: ${track.title}` }
    }
    case 'mark_chapter_complete': {
      const chapterId = String(input.chapter_id ?? '')
      const chapter = findChapter(chapterId)
      if (!chapter) return { content: `Unknown chapter: ${chapterId}`, isError: true }
      if (!session.completedChapters.includes(chapterId)) {
        session.completedChapters.push(chapterId)
      }
      send('chapter_completed', { chapterId })
      return { content: `Chapter complete: ${chapter.label}` }
    }
    case 'update_world_mood': {
      const mood = String(input.mood ?? '').slice(0, 32)
      if (!mood) return { content: 'mood required', isError: true }
      session.currentMood = mood
      send('mood_changed', { mood })
      return { content: `Mood: ${mood}` }
    }
    case 'show_support_resources': {
      send('support_resources', {})
      return { content: 'Support resources shown.' }
    }
    case 'end_session_softly': {
      const farewell = String(input.farewell ?? '').slice(0, 500)
      session.endedAt = Date.now()
      send('session_ended', { farewell })
      return { content: 'Session ended.' }
    }
    default:
      return { content: `Unknown tool: ${name}`, isError: true }
  }
}

function _sessionShape(_s: Session): ChatMessage[] {
  return _s.history
}
