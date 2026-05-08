export interface ClientChapter {
  id: string
  label: string
  order: number
}

export interface ClientTrack {
  id: string
  title: string
  chapterId: string
  order: number
  files: { high: string; low: string }
  durationSeconds?: number
}

interface Manifest {
  chapters: ClientChapter[]
  tracks: ClientTrack[]
}

export function useTrackManifest() {
  const data = useState<Manifest>('tracks-manifest', () => ({
    chapters: [],
    tracks: [],
  }))

  async function load() {
    if (data.value.tracks.length > 0 || data.value.chapters.length > 0) return
    try {
      const res = await $fetch<Manifest>('/api/tracks')
      data.value = res
    } catch {
      // leave empty
    }
  }

  function findTrack(id: string): ClientTrack | undefined {
    return data.value.tracks.find((t) => t.id === id)
  }

  function trackUrls(t: ClientTrack): string[] {
    const base = useRuntimeConfig().public.audioBaseUrl
    const join = (p: string) => `${base}${p.startsWith('/') ? '' : '/'}${p}`
    return [join(t.files.high), join(t.files.low)]
  }

  return { data, load, findTrack, trackUrls }
}
