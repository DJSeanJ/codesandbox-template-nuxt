import type { ChatMessage, ChatRequestBody } from '~~/shared/types'
import {
  anthropic,
  MODEL,
  MAX_TOKENS,
  buildCachedSystemBlocks,
} from '~~/server/utils/anthropic'
import { assertRateLimit } from '~~/server/utils/rateLimit'
import { preflightUserMessage, scanOutput } from '~~/server/utils/moderation'
import {
  RELEASED_DAY_NUMBERS,
  tracksForDay,
} from '~~/server/prompts/tracks'

const HISTORY_WINDOW = 24 // last N messages of prior turns kept per request
const MAX_HISTORY_LEN = 64 // hard limit on incoming history array length

export default defineEventHandler(async (event) => {
  await assertRateLimit(event)

  const body = await readBody<ChatRequestBody>(event)
  if (!body || typeof body.message !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const day = Number.isFinite(body.day) ? Math.floor(body.day) : NaN
  if (!RELEASED_DAY_NUMBERS.includes(day)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown or unreleased day: ${body.day}`,
    })
  }

  const moderation = preflightUserMessage(body.message)
  if (!moderation.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: `Rejected: ${moderation.reason}`,
    })
  }

  const incomingHistory = Array.isArray(body.history) ? body.history : []
  if (incomingHistory.length > MAX_HISTORY_LEN) {
    throw createError({ statusCode: 400, statusMessage: 'History too long' })
  }

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

  const cachedSystem = buildCachedSystemBlocks()
  const dayContext = buildDayContextBlock(day)
  const systemBlocks = [
    ...cachedSystem,
    { type: 'text' as const, text: dayContext },
  ]

  const trimmedHistory: ChatMessage[] = sanitizeHistory(incomingHistory).slice(
    -HISTORY_WINDOW,
  )

  const messages = [
    ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: moderation.augmentedInput },
  ]

  try {
    const client = anthropic()
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks as never,
      messages: messages as never,
    })

    let textBuffer = ''
    stream.on('text', (delta: string) => {
      textBuffer += delta
      send('text_delta', { text: delta })
    })

    const finalMessage = await stream.finalMessage()

    if (textBuffer.trim()) {
      const scan = scanOutput(textBuffer)
      if (!scan.clean) {
        send('error', {
          message: 'Output blocked by post-flight content scan.',
        })
        send('done', { stopReason: 'blocked' })
        res.end()
        return
      }
    }

    send('done', { stopReason: finalMessage.stop_reason ?? 'end_turn' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    send('error', { message })
    send('done', { stopReason: 'error' })
  } finally {
    res.end()
  }
})

function sanitizeHistory(input: unknown[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const m of input) {
    if (!m || typeof m !== 'object') continue
    const obj = m as Record<string, unknown>
    if (obj.role !== 'user' && obj.role !== 'assistant') continue
    if (typeof obj.content !== 'string') continue
    if (obj.content.length === 0 || obj.content.length > 8000) continue
    out.push({ role: obj.role, content: obj.content })
  }
  return out
}

function buildDayContextBlock(day: number): string {
  const todayTracks = tracksForDay(day)
  const todayLines = todayTracks
    .map((t) => `  - Part ${t.part}: "${t.title}" (id: ${t.id})`)
    .join('\n')
  const releasedDays = RELEASED_DAY_NUMBERS.join(', ')
  return [
    '<context>',
    `The visitor is currently on Day ${day}'s page.`,
    '',
    "Today's foregrounded tracks:",
    todayLines,
    '',
    `Released days the visitor may know: ${releasedDays}.`,
    '',
    'Lead with Part One first if the visitor is open-ended. Do not preview tracks from days not in the released list.',
    '</context>',
  ].join('\n')
}
