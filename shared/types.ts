export type Role = 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

export interface ChatRequestBody {
  day: number
  message: string
  history: ChatMessage[]
}

export type SseEvent =
  | { event: 'text_delta'; data: { text: string } }
  | { event: 'error'; data: { message: string } }
  | { event: 'done'; data: { stopReason: string } }
