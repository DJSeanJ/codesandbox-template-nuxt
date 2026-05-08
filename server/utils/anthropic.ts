import Anthropic from '@anthropic-ai/sdk'
import systemMdRaw from '../prompts/system.md?raw'
import { trackManifestForPrompt } from '../prompts/tracks'

export const MODEL = 'claude-sonnet-4-6'
export const MAX_TOKENS = 1024

let _client: Anthropic | null = null

export function anthropic(): Anthropic {
  if (_client) return _client
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ANTHROPIC_API_KEY is not configured',
    })
  }
  _client = new Anthropic({ apiKey: config.anthropicApiKey })
  return _client
}

interface CachedTextBlock {
  type: 'text'
  text: string
  cache_control: { type: 'ephemeral' }
}

function buildSystemMarkdown(): string {
  return systemMdRaw.replace('{{TRACKS}}', trackManifestForPrompt())
}

function splitSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const matches = [...md.matchAll(/^## (.+)$/gm)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const next = matches[i + 1]
    const start = m.index ?? 0
    const end = next ? (next.index ?? md.length) : md.length
    sections[m[1].trim().toLowerCase()] = md.slice(start, end).trim()
  }
  return sections
}

export function buildCachedSystemBlocks(): CachedTextBlock[] {
  const sections = splitSections(buildSystemMarkdown())
  const worldVoice = [sections['world'], sections['voice']].filter(Boolean).join('\n\n')
  const guardrails = sections['guardrails'] ?? ''
  const tracks = sections['tracks'] ?? ''
  const blocks: CachedTextBlock[] = []
  if (worldVoice) {
    blocks.push({ type: 'text', text: worldVoice, cache_control: { type: 'ephemeral' } })
  }
  if (guardrails) {
    blocks.push({ type: 'text', text: guardrails, cache_control: { type: 'ephemeral' } })
  }
  if (tracks) {
    blocks.push({ type: 'text', text: tracks, cache_control: { type: 'ephemeral' } })
  }
  return blocks
}
