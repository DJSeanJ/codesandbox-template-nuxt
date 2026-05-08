export const useRevealedTracks = () => {
  const list = useState<string[]>('revealed-tracks', () => [])
  return {
    list,
    has: (id: string) => list.value.includes(id),
    add: (id: string) => {
      if (!list.value.includes(id)) list.value = [...list.value, id]
    },
    setAll: (ids: string[]) => {
      list.value = [...ids]
    },
  }
}

export const useWorldMood = () => useState<string>('world-mood', () => 'arrival')

export const useCompletedChapters = () =>
  useState<string[]>('completed-chapters', () => [])

export const useSessionEnded = () => useState<boolean>('session-ended', () => false)

export const useFarewell = () => useState<string | null>('session-farewell', () => null)

export const useShowSupport = () => useState<boolean>('show-support', () => false)
