interface ToolDef {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const TOOLS: readonly ToolDef[] = [
  {
    name: 'reveal_track',
    description:
      "Reveal a single track to the visitor. The audio becomes playable on the client only after the server validates this call. Reveal tracks in chapter order. Reveal at most one track per ~5 substantive turns. You may not 'unreveal' a track once revealed.",
    input_schema: {
      type: 'object',
      properties: {
        track_id: {
          type: 'string',
          description: 'The id of the track to reveal. Must match an id from the track manifest.',
        },
        reason: {
          type: 'string',
          description:
            'A short reflective sentence describing why this moment is the right one to reveal this track. Internal — not shown to the visitor.',
        },
      },
      required: ['track_id', 'reason'],
    },
  },
  {
    name: 'mark_chapter_complete',
    description:
      "Mark a chapter of the narrative arc as complete. Use when the conversation has substantively explored the chapter's theme and any track within it has been revealed.",
    input_schema: {
      type: 'object',
      properties: {
        chapter_id: {
          type: 'string',
          description: 'The chapter id from the manifest.',
        },
      },
      required: ['chapter_id'],
    },
  },
  {
    name: 'update_world_mood',
    description:
      "Shift the world's ambient mood to reflect a meaningful change in the conversation's emotional weather. The client uses this to reshape the ambient canvas palette. Do not call on every turn — only on real shifts.",
    input_schema: {
      type: 'object',
      properties: {
        mood: {
          type: 'string',
          description:
            'A short mood token. Examples: dawn, storm, still, embers, low_tide, late_winter, threshold, hush.',
        },
      },
      required: ['mood'],
    },
  },
  {
    name: 'show_support_resources',
    description:
      'Display a support-resources overlay to the visitor (crisis hotlines). Call this once if the visitor expresses self-harm ideation, then return to the in-world voice with care. Do not call repeatedly.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'end_session_softly',
    description:
      'Gracefully close the session. Use when the visitor signals overload, that they want to step away, or that they are leaving.',
    input_schema: {
      type: 'object',
      properties: {
        farewell: {
          type: 'string',
          description: 'A short in-voice farewell line shown to the visitor.',
        },
      },
      required: ['farewell'],
    },
  },
] as const

export function cachedTools(): unknown[] {
  const tools: Record<string, unknown>[] = TOOLS.map((t) => ({ ...t }))
  if (tools.length > 0) {
    tools[tools.length - 1] = {
      ...tools[tools.length - 1],
      cache_control: { type: 'ephemeral' },
    }
  }
  return tools
}
