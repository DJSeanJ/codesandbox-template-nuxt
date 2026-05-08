import { newSession, saveSession } from '~~/server/utils/storage'

export default defineEventHandler(async () => {
  const session = newSession()
  await saveSession(session)
  return {
    sessionId: session.id,
    revealedTracks: session.revealedTracks,
    completedChapters: session.completedChapters,
    currentMood: session.currentMood,
    history: [],
    endedAt: null,
  }
})
