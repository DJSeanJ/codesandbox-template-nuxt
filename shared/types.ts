export type Role = 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
  ts: number
}

export interface RevealedTrackEvent {
  trackId: string
  reason: string
}

export interface MoodChange {
  mood: string
  ts: number
}

export interface Session {
  id: string
  history: ChatMessage[]
  revealedTracks: string[]
  completedChapters: string[]
  currentMood: string
  endedAt: number | null
  createdAt: number
  updatedAt: number
}

export type SseEvent =
  | { event: 'text_delta'; data: { text: string } }
  | { event: 'tool_use'; data: { name: string; input: unknown } }
  | { event: 'track_revealed'; data: { trackId: string } }
  | { event: 'mood_changed'; data: { mood: string } }
  | { event: 'chapter_completed'; data: { chapterId: string } }
  | { event: 'support_resources'; data: Record<string, never> }
  | { event: 'session_ended'; data: { farewell: string } }
  | { event: 'error'; data: { message: string } }
  | { event: 'done'; data: { stopReason: string } }
