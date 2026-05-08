import { TRACKS, CHAPTERS } from '~~/server/prompts/tracks'

export default defineEventHandler(() => {
  return {
    chapters: CHAPTERS.map((c) => ({
      id: c.id,
      label: c.label,
      order: c.order,
    })),
    tracks: TRACKS.map((t) => ({
      id: t.id,
      title: t.title,
      chapterId: t.chapterId,
      order: t.order,
      files: t.files,
      durationSeconds: t.durationSeconds,
    })),
  }
})
