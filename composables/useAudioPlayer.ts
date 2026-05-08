import { Howl } from 'howler'

interface PlayerState {
  trackId: string | null
  isPlaying: boolean
  position: number
  duration: number
}

const cache = new Map<string, Howl>()
let raf: number | null = null

export function useAudioPlayer() {
  const state = useState<PlayerState>('audio-player', () => ({
    trackId: null,
    isPlaying: false,
    position: 0,
    duration: 0,
  }))

  function tick() {
    if (!import.meta.client) return
    const current = state.value.trackId ? cache.get(state.value.trackId) : null
    if (current && state.value.isPlaying) {
      state.value.position = current.seek() as number
      state.value.duration = current.duration() || 0
      raf = requestAnimationFrame(tick)
    } else if (raf !== null) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function loadHowl(trackId: string, urls: string[]): Howl {
    const existing = cache.get(trackId)
    if (existing) return existing
    const howl = new Howl({
      src: urls,
      html5: true,
      preload: false,
    })
    howl.on('end', () => {
      if (state.value.trackId === trackId) {
        state.value.isPlaying = false
        state.value.position = 0
      }
    })
    cache.set(trackId, howl)
    return howl
  }

  function play(trackId: string, urls: string[]) {
    if (!import.meta.client) return
    if (state.value.trackId && state.value.trackId !== trackId) {
      const prev = cache.get(state.value.trackId)
      prev?.stop()
    }
    const howl = loadHowl(trackId, urls)
    state.value.trackId = trackId
    howl.play()
    state.value.isPlaying = true
    if (raf === null) tick()
  }

  function pause() {
    if (!state.value.trackId) return
    cache.get(state.value.trackId)?.pause()
    state.value.isPlaying = false
  }

  function resume() {
    if (!state.value.trackId) return
    cache.get(state.value.trackId)?.play()
    state.value.isPlaying = true
    if (raf === null) tick()
  }

  function toggle(trackId: string, urls: string[]) {
    if (state.value.trackId === trackId && state.value.isPlaying) pause()
    else if (state.value.trackId === trackId) resume()
    else play(trackId, urls)
  }

  function seek(seconds: number) {
    if (!state.value.trackId) return
    cache.get(state.value.trackId)?.seek(seconds)
    state.value.position = seconds
  }

  return { state, play, pause, resume, toggle, seek }
}
