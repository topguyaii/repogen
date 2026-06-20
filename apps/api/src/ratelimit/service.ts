import { getRedisClient } from '../lib/redis'

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  // Requests per window
  maxRequests: number
  // Window size in seconds
  windowSeconds: number
  // Key prefix for Redis
  keyPrefix: string
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // Unix timestamp
  retryAfter?: number // Seconds until next request allowed
}

// Default rate limits
export const RATE_LIMITS = {
  // Per API key: 60 requests per minute
  perKey: {
    maxRequests: 60,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:key',
  } as RateLimitConfig,

  // Per IP: 100 requests per minute (for unauthenticated endpoints)
  perIp: {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:ip',
  } as RateLimitConfig,

  // Global: 10000 requests per minute (DDoS protection)
  global: {
    maxRequests: 10000,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:global',
  } as RateLimitConfig,
}

/**
 * Check and increment rate limit using sliding window
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.windowSeconds
  const key = `${config.keyPrefix}:${identifier}`

  // Use sorted set for sliding window
  // Score = timestamp, member = unique request ID
  const requestId = `${now}:${Math.random().toString(36).slice(2)}`

  // In MockRedis, we'll use a simpler approach
  if ('budgetCheckAndReserve' in redis) {
    // MockRedis - use simple counter
    return checkRateLimitSimple(identifier, config)
  }

  // Real Redis - use sorted set sliding window
  const multi = (redis as any).multi()

  // Remove old entries outside the window
  multi.zremrangebyscore(key, 0, windowStart)

  // Count current entries
  multi.zcard(key)

  // Add new entry
  multi.zadd(key, now, requestId)

  // Set expiry on the key
  multi.expire(key, config.windowSeconds)

  const results = await multi.exec()
  const currentCount = results[1][1] as number

  const resetAt = now + config.windowSeconds
  const remaining = Math.max(0, config.maxRequests - currentCount - 1)

  if (currentCount >= config.maxRequests) {
    // Remove the entry we just added since we're over limit
    await (redis as any).zrem(key, requestId)

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: config.windowSeconds,
    }
  }

  return {
    allowed: true,
    remaining,
    resetAt,
  }
}

/**
 * Simple counter-based rate limiting for MockRedis
 */
async function checkRateLimitSimple(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const now = Math.floor(Date.now() / 1000)
  const windowKey = Math.floor(now / config.windowSeconds)
  const key = `${config.keyPrefix}:${identifier}:${windowKey}`

  const currentStr = await redis.get(key)
  const current = currentStr ? parseInt(currentStr, 10) : 0

  const resetAt = (windowKey + 1) * config.windowSeconds
  const remaining = Math.max(0, config.maxRequests - current - 1)

  if (current >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: resetAt - now,
    }
  }

  // Increment counter
  await redis.set(key, (current + 1).toString(), 'EX', config.windowSeconds)

  return {
    allowed: true,
    remaining,
    resetAt,
  }
}

/**
 * Check multiple rate limits at once
 * Returns the most restrictive result
 */
export async function checkMultipleRateLimits(
  checks: Array<{ identifier: string; config: RateLimitConfig }>
): Promise<RateLimitResult & { limitType?: string }> {
  const results = await Promise.all(
    checks.map(async ({ identifier, config }) => ({
      result: await checkRateLimit(identifier, config),
      type: config.keyPrefix,
    }))
  )

  // Find the most restrictive (first not allowed, or lowest remaining)
  for (const { result, type } of results) {
    if (!result.allowed) {
      return { ...result, limitType: type }
    }
  }

  // All allowed - return the one with lowest remaining
  const sorted = results.sort((a, b) => a.result.remaining - b.result.remaining)
  return { ...sorted[0].result, limitType: sorted[0].type }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<{ current: number; limit: number; resetAt: number }> {
  const redis = getRedisClient()
  const now = Math.floor(Date.now() / 1000)
  const windowKey = Math.floor(now / config.windowSeconds)
  const key = `${config.keyPrefix}:${identifier}:${windowKey}`

  const currentStr = await redis.get(key)
  const current = currentStr ? parseInt(currentStr, 10) : 0
  const resetAt = (windowKey + 1) * config.windowSeconds

  return {
    current,
    limit: config.maxRequests,
    resetAt,
  }
}

/**
 * Reset rate limit for an identifier (admin use)
 */
export async function resetRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const redis = getRedisClient()
  const now = Math.floor(Date.now() / 1000)
  const windowKey = Math.floor(now / config.windowSeconds)
  const key = `${config.keyPrefix}:${identifier}:${windowKey}`
  await redis.del(key)
}
