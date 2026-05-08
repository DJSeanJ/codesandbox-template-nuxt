import { nanoid } from 'nanoid'
import type { Session, ChatMessage } from '~~/shared/types'

const ROLLING_WINDOW_TURNS = 40

export function newSession(id: string = nanoid()): Session {
  const now = Date.now()
  return {
    id,
    history: [],
    revealedTracks: [],
    completedChapters: [],
    currentMood: 'arrival',
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export async function loadSession(id: string): Promise<Session | null> {
  const storage = useStorage('sessions')
  const session = await storage.getItem<Session>(id)
  return session ?? null
}

export async function saveSession(session: Session): Promise<void> {
  session.updatedAt = Date.now()
  const storage = useStorage('sessions')
  await storage.setItem(session.id, session)
}

export async function ensureSession(id: string | null | undefined): Promise<Session> {
  if (id) {
    const existing = await loadSession(id)
    if (existing) return existing
  }
  const created = newSession()
  await saveSession(created)
  return created
}

export function rollingWindow(history: ChatMessage[]): ChatMessage[] {
  if (history.length <= ROLLING_WINDOW_TURNS) return history
  return history.slice(-ROLLING_WINDOW_TURNS)
}
