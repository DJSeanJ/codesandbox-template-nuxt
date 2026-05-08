import { loadSession } from '~~/server/utils/storage'

const SYSTEM_NOTE_RE = /<system_note>[\s\S]*?<\/system_note>\s*/g

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = typeof query.id === 'string' ? query.id : null
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const session = await loadSession(id)
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: 'session not found' })
  }
  return {
    sessionId: session.id,
    revealedTracks: session.revealedTracks,
    completedChapters: session.completedChapters,
    currentMood: session.currentMood,
    endedAt: session.endedAt,
    history: session.history.map((m) => ({
      role: m.role,
      content:
        m.role === 'user' ? m.content.replace(SYSTEM_NOTE_RE, '') : m.content,
      ts: m.ts,
    })),
  }
})
