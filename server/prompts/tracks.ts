export interface Chapter {
  id: string
  label: string
  order: number
  description: string
}

export interface Track {
  id: string
  title: string
  chapterId: string
  order: number
  files: {
    high: string
    low: string
  }
  gatingBeat: string
  durationSeconds?: number
}

// TODO: Replace with the real chapter arc when narrative is finalized.
// The chapter shape below is a placeholder. Names, count, and order are yours.
export const CHAPTERS: Chapter[] = [
  {
    id: 'arrival',
    label: 'Arrival',
    order: 1,
    description: 'The visitor enters the world. Orientation, first ground.',
  },
  {
    id: 'inheritance',
    label: 'Inheritance',
    order: 2,
    description: 'What was passed down. What was learned by watching.',
  },
  {
    id: 'protection',
    label: 'Protection',
    order: 3,
    description: 'The instinct to stand between. The cost of standing alone.',
  },
  {
    id: 'silence',
    label: 'Silence',
    order: 4,
    description: 'What goes unsaid. What grows in the unsaid.',
  },
  {
    id: 'continuance',
    label: 'Continuance',
    order: 5,
    description: 'The next generation. The choice to do it differently.',
  },
]

// TODO: Replace with actual track manifest once tracks are finalized.
// Each track must have:
//   - id: stable slug, used in tool calls
//   - title: shown to listener
//   - chapterId: must match a CHAPTERS id
//   - order: global play order
//   - files.high / files.low: paths relative to NUXT_PUBLIC_AUDIO_BASE_URL
//   - gatingBeat: a one-sentence narrative description of the conversational
//     moment that should unlock this track. Authored copy that goes into the
//     system prompt's track manifest section.
export const TRACKS: Track[] = []

export function findTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id)
}

export function findChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id)
}

export function trackManifestForPrompt(): string {
  if (TRACKS.length === 0) {
    return '(No tracks have been added to the manifest yet.)'
  }
  return TRACKS.map((t) => {
    const chapter = findChapter(t.chapterId)
    return `- id: \`${t.id}\` — title: "${t.title}" — chapter: ${chapter?.label ?? t.chapterId} — gating beat: ${t.gatingBeat}`
  }).join('\n')
}
