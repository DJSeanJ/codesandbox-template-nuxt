# Life Is Gonna Life — chat widget

A floating chat widget that gets embedded into the GoHighLevel day pages of
the *Life Is Gonna Life* release. The widget speaks as the artist: grounded,
Baltimore-specific, vulnerable, day-aware.

This repo is **not a website**. It is two pieces:

1. A small Nuxt 3 app whose only customer-facing route is `/embed?day=N`,
   intended to be loaded inside an iframe on a GHL day page.
2. A serverless chat endpoint at `/api/chat` that streams Claude responses
   over Server-Sent Events, with day context and prompt-cached system
   blocks.

## Stack

- Nuxt 3 (Vue 3 + Nitro)
- Anthropic SDK (Claude Sonnet 4.6) with prompt caching
- Server-Sent Events for streaming responses
- No database, no session storage — chat is stateless per page load

## Local development

```bash
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY
npm run dev
```

Visit:

- `http://localhost:3000` — dev preview (mock GHL day page with the iframe overlaid; switch days with the buttons)
- `http://localhost:3000/embed?day=1` — the widget on its own (what GHL sees)
- `http://localhost:3000/embed-snippet.html` — the GHL paste-in snippet for production

## Deploying

Deploy the Nuxt app to any Nitro target (Vercel, Cloudflare Pages, Netlify,
Render). Set the `ANTHROPIC_API_KEY` env var in the host. Note the public URL
of the deployment; it becomes the `CHAT_HOST` referenced in
`public/embed-snippet.html`.

Then on each GHL day page, paste the matching snippet from
`embed-snippet.html` into a Custom Code block, replacing `CHAT_HOST` with
your deployed URL.

Before launch, also tighten the CSP frame-ancestors header in `nuxt.config.ts`
from `*` to your specific GHL/test.djseanj.com origin.

## Architecture

| Path | Purpose |
|---|---|
| `pages/embed.vue` | The route loaded inside the iframe on each GHL page; reads `?day=N` |
| `pages/index.vue` | Local dev preview — mock GHL page + the iframed widget |
| `components/widget/Launcher.vue` | Owns open/closed state; posts `resize` messages to the parent page |
| `components/widget/Bubble.vue` | The closed-state floating button |
| `components/widget/Panel.vue` | The open-state chat panel |
| `components/chat/*` | Message list, message bubble, input, typing indicator |
| `composables/useChat.ts` | Stateless per-page chat client; streams SSE from the chat endpoint |
| `server/api/chat.post.ts` | Streaming chat endpoint; injects per-request day context |
| `server/utils/anthropic.ts` | SDK client + cached system-prompt blocks |
| `server/utils/moderation.ts` | Pre-flight injection scan + post-flight forbidden-noun scan |
| `server/utils/rateLimit.ts` | Per-IP token-bucket limiter |
| `server/prompts/system.ts` | Authored system prompt (cached); split by H2 heading into separate prompt-cache blocks |
| `server/prompts/tracks.ts` | Day-keyed track catalog with per-track artist-voice frames |
| `server/prompts/forbidden.ts` | Names that must never appear in output (loaded from `FORBIDDEN_PROPER_NOUNS` env var) |
| `public/embed-snippet.html` | The HTML to paste into each GHL day page |

## How day-awareness works

Each GHL day page embeds the iframe with `?day=N` baked into the URL. The
widget reads that param and sends it with every chat request. The server
appends a per-request *day context* note to the system prompt (after the
cached blocks, so the cache stays warm), telling the agent which two tracks
are foregrounded for this visitor and which days are currently released.

## Adding a new day

1. Add the two new tracks to `TRACKS` in `server/prompts/tracks.ts` with
   `day: N`, `part: 1` and `part: 2`, and an artist-voice frame for each.
   The agent will pick them up automatically.
2. Append a Day N block to `public/embed-snippet.html`.
3. Paste the new block into the new GHL day page's Custom Code block.

No code changes needed for the agent itself.

## Guardrails

The agent operates inside layered guardrails (see
`server/utils/moderation.ts` and `server/prompts/system.ts`):

- Pre-flight scan rejects oversized inputs and flags known prompt-injection
  patterns; flagged inputs still go through but are wrapped in a system
  note that tells the agent to re-anchor without engaging.
- The system prompt (`server/prompts/system.ts`) holds anti-jailbreak,
  scope, length, and crisis-response rules.
- Post-flight scan blocks any output that matches `FORBIDDEN_PROPER_NOUNS`
  (set via env to keep real names out of any public commit).
- The agent never names itself, never confirms it is an AI, and never
  previews tracks from days that haven't been released.

## Disclosure

The agent speaks in first person as the artist. The artist's name is not
spoken by the agent. The published artist notes that ground the voice are
the source of truth — the agent doesn't invent biography.
