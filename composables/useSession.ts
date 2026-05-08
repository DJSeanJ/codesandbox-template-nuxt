const STORAGE_KEY = 'lifeisgonnalive.sessionId'

export const useSessionId = () => useState<string | null>('session-id', () => null)

export function useSession() {
  const sessionId = useSessionId()

  function readLocal(): string | null {
    if (!import.meta.client) return null
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  }

  function writeLocal(id: string) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // ignore
    }
  }

  async function ensure(): Promise<string> {
    if (sessionId.value) return sessionId.value
    const stored = readLocal()
    if (stored) {
      sessionId.value = stored
      return stored
    }
    const created = await $fetch<{ sessionId: string }>('/api/session', {
      method: 'POST',
    })
    sessionId.value = created.sessionId
    writeLocal(created.sessionId)
    return created.sessionId
  }

  function setId(id: string) {
    sessionId.value = id
    writeLocal(id)
  }

  return { sessionId, ensure, setId }
}
