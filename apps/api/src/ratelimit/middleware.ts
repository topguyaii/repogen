import type { Context, Next } from 'hono'
import { checkMultipleRateLimits, RATE_LIMITS } from './service'
import type { APIKeyData } from '../auth/api-key'

/**
 * Rate limit headers to include in responses
 */
export function setRateLimitHeaders(
  c: Context,
  remaining: number,
  resetAt: number,
  limit: number
): void {
  c.header('X-RateLimit-Limit', limit.toString())
  c.header('X-RateLimit-Remaining', remaining.toString())
  c.header('X-RateLimit-Reset', resetAt.toString())
}

/**
 * Rate limiting middleware
 * Checks per-key and global rate limits
 */
export async function rateLimitMiddleware(c: Context, next: Next) {
  const apiKey = c.get('apiKey') as APIKeyData | undefined

  // Get client IP for global rate limiting
  const clientIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'

  // Build rate limit checks
  const checks = [
    // Global rate limit
    { identifier: 'global', config: RATE_LIMITS.global },
  ]

  if (apiKey) {
    // Per-key rate limit for authenticated requests
    checks.push({ identifier: apiKey.id, config: RATE_LIMITS.perKey })
  } else {
    // Per-IP rate limit for unauthenticated requests
    checks.push({ identifier: clientIp, config: RATE_LIMITS.perIp })
  }

  const result = await checkMultipleRateLimits(checks)

  // Set rate limit headers
  const limit = apiKey ? RATE_LIMITS.perKey.maxRequests : RATE_LIMITS.perIp.maxRequests
  setRateLimitHeaders(c, result.remaining, result.resetAt, limit)

  if (!result.allowed) {
    c.header('Retry-After', (result.retryAfter || 60).toString())

    return c.json(
      {
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded',
          retry_after: result.retryAfter,
        },
      },
      429
    )
  }

  await next()
}

/**
 * Request size limit middleware
 * Prevents oversized requests from consuming resources
 */
export const REQUEST_SIZE_LIMITS = {
  maxBodySize: 10 * 1024 * 1024, // 10 MB
  maxMessageLength: 100000, // 100k characters per message
  maxMessages: 100, // Max messages in conversation
}

export async function requestSizeLimitMiddleware(c: Context, next: Next) {
  const contentLength = c.req.header('content-length')

  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > REQUEST_SIZE_LIMITS.maxBodySize) {
      return c.json(
        {
          error: {
            message: `Request body too large. Maximum size is ${REQUEST_SIZE_LIMITS.maxBodySize} bytes`,
            type: 'invalid_request_error',
            code: 'request_too_large',
          },
        },
        413
      )
    }
  }

  await next()
}

/**
 * Timeout middleware
 * Aborts requests that take too long
 */
export const TIMEOUT_LIMITS = {
  defaultTimeout: 120000, // 2 minutes
  streamingTimeout: 300000, // 5 minutes for streaming
}

export async function timeoutMiddleware(c: Context, next: Next) {
  const isStreaming = c.req.header('accept')?.includes('text/event-stream')
  const timeout = isStreaming ? TIMEOUT_LIMITS.streamingTimeout : TIMEOUT_LIMITS.defaultTimeout

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // Store abort controller for potential cancellation
  c.set('abortController', controller)

  try {
    await next()
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Suspicious pattern detection (without logging content)
 * Detects potential abuse patterns based on metadata only
 */
export interface AbuseSignal {
  type: 'rapid_requests' | 'error_spike' | 'unusual_model_switching' | 'cost_anomaly'
  score: number // 0-1, higher = more suspicious
  metadata: Record<string, number | string>
}

// In-memory tracking for abuse signals (would use Redis in production)
const abuseTracking = new Map<string, {
  requestTimestamps: number[]
  errorCount: number
  modelChanges: number
  lastModel?: string
  totalCost: number
}>()

export function trackAbuseSignals(
  apiKeyId: string,
  modelId: string,
  isError: boolean,
  costUsd: number
): AbuseSignal[] {
  const now = Date.now()
  const windowMs = 60000 // 1 minute window

  // Get or create tracking data
  let tracking = abuseTracking.get(apiKeyId)
  if (!tracking) {
    tracking = {
      requestTimestamps: [],
      errorCount: 0,
      modelChanges: 0,
      totalCost: 0,
    }
    abuseTracking.set(apiKeyId, tracking)
  }

  // Clean old timestamps
  tracking.requestTimestamps = tracking.requestTimestamps.filter(t => now - t < windowMs)

  // Add new request
  tracking.requestTimestamps.push(now)

  // Track errors
  if (isError) {
    tracking.errorCount++
  }

  // Track model changes
  if (tracking.lastModel && tracking.lastModel !== modelId) {
    tracking.modelChanges++
  }
  tracking.lastModel = modelId

  // Track cost
  tracking.totalCost += costUsd

  // Detect abuse signals
  const signals: AbuseSignal[] = []

  // Rapid requests: > 30 requests in 1 minute
  if (tracking.requestTimestamps.length > 30) {
    signals.push({
      type: 'rapid_requests',
      score: Math.min(1, tracking.requestTimestamps.length / 60),
      metadata: { requests_per_minute: tracking.requestTimestamps.length },
    })
  }

  // Error spike: > 10 errors in a row
  if (tracking.errorCount > 10) {
    signals.push({
      type: 'error_spike',
      score: Math.min(1, tracking.errorCount / 20),
      metadata: { error_count: tracking.errorCount },
    })
  }

  // Unusual model switching: > 10 different models in 1 minute
  if (tracking.modelChanges > 10) {
    signals.push({
      type: 'unusual_model_switching',
      score: Math.min(1, tracking.modelChanges / 20),
      metadata: { model_changes: tracking.modelChanges },
    })
  }

  // Cost anomaly: > $10 in 1 minute
  if (tracking.totalCost > 10) {
    signals.push({
      type: 'cost_anomaly',
      score: Math.min(1, tracking.totalCost / 20),
      metadata: { cost_per_minute: tracking.totalCost },
    })
  }

  // Reset error count on success
  if (!isError) {
    tracking.errorCount = 0
  }

  return signals
}

/**
 * Clear abuse tracking (for testing)
 */
export function clearAbuseTracking(): void {
  abuseTracking.clear()
}
