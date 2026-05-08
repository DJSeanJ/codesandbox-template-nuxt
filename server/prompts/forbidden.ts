// CRITICAL — handle with care.
//
// This list contains real-world proper nouns (names, places, identifying
// terms) that must never appear in any model output. It is used by the
// post-flight moderation scan in `server/utils/moderation.ts`.
//
// Rules:
//   1. NEVER commit real entries to this file in a public repository.
//   2. In production, populate via the FORBIDDEN_PROPER_NOUNS env var
//      (comma-separated). The loader prefers env over the static array.
//   3. For local development with sensitive entries, create a sibling file
//      `forbidden.local.ts` (already gitignored) that exports the same name.
//      Import resolution will prefer it if present.
//   4. Entries are matched case-insensitively as whole-word boundaries.
//
// The static array below is intentionally empty. Populate via env.

const FROM_ENV: string[] =
  (process.env.FORBIDDEN_PROPER_NOUNS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const FORBIDDEN_PROPER_NOUNS: string[] = FROM_ENV
