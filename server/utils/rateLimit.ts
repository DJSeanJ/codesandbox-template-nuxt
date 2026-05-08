import type { H3Event } from 'h3'

interface Bucket {
  tokens: number
  updatedAt: number
}

interface Config {
  capacity: number
  refillTokens: number
  refillIntervalMs: number
}

const HOUR: Config = {
  capacity: 30,
  refillTokens: 30,
  refillIntervalMs: 60 * 60 * 1000,
}

const MINUTE: Config = {
  capacity: 6,
  refillTokens: 6,
  refillIntervalMs: 60 * 1000,
}

function clientIp(event: H3Event): string {
  const headers = getRequestHeaders(event)
  const xff = headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim()
  }
  const cf = headers['cf-connecting-ip']
  if (typeof cf === 'string') return cf
  return event.node.req.socket?.remoteAddress ?? 'unknown'
}

async function consume(key: string, cfg: Config): Promise<boolean> {
  const storage = useStorage('cache')
  const now = Date.now()
  const existing = (await storage.getItem<Bucket>(key)) ?? {
    tokens: cfg.capacity,
    updatedAt: now,
  }
  const elapsed = Math.max(0, now - existing.updatedAt)
  const refill = (elapsed / cfg.refillIntervalMs) * cfg.refillTokens
  const tokens = Math.min(cfg.capacity, existing.tokens + refill)
  if (tokens < 1) {
    await storage.setItem(key, { tokens, updatedAt: now })
    return false
  }
  await storage.setItem(key, { tokens: tokens - 1, updatedAt: now })
  return true
}

export async function assertRateLimit(event: H3Event): Promise<void> {
  const ip = clientIp(event)
  const okMin = await consume(`rl:m:${ip}`, MINUTE)
  if (!okMin) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests (per minute)' })
  }
  const okHour = await consume(`rl:h:${ip}`, HOUR)
  if (!okHour) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests (per hour)' })
  }
}
