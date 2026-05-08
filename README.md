# Life Is Gonna Live

An interactive listening experience: an LLM-powered chatbot guides visitors through a metaphor-built world and reveals tracks of an instrumental album as they engage.

## Stack

- Nuxt 3 (Vue 3 + Nitro)
- Anthropic SDK (Claude Sonnet 4.6) with prompt caching
- Server-Sent Events for streaming
- Howler.js for audio
- Server-authoritative session state via Nitro storage (filesystem in dev, Cloudflare KV in prod)

## Local development

```bash
pnpm install        # or npm install / yarn install
cp .env.example .env
# fill in ANTHROPIC_API_KEY
pnpm dev
```

Visit http://localhost:3000.

## Architecture

| Path | Purpose |
|---|---|
| `pages/index.vue` | Single-page experience entry |
| `components/world/` | Ambient canvas + track orbs + progress |
| `components/chat/` | Chat panel UI |
| `components/audio/` | Player UI |
| `composables/` | `useChat`, `useAudioPlayer`, `useSession`, `useRevealedTracks` |
| `server/api/chat.post.ts` | SSE endpoint streaming Claude responses |
| `server/api/session.{get,post}.ts` | Session lifecycle |
| `server/utils/anthropic.ts` | SDK client + prompt-cache config |
| `server/utils/tools.ts` | Tool definitions for `reveal_track` etc. |
| `server/prompts/system.md` | Authored system prompt (cached) |
| `server/prompts/tracks.ts` | Track manifest |
| `server/prompts/forbidden.ts` | Names that must never appear in output |

## Guardrails

The agent operates inside layered guardrails (see `server/utils/moderation.ts` and the system prompt) that prevent naming real people, speculation about identities, off-topic responses, or out-of-order track reveals. Audio is gated server-side via tool-call validation — the LLM cannot reveal a track it has not been authorized to.

## Disclosure

This is a work of metaphor. No statements about any real person are intended or should be inferred.
