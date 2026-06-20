import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  checkMultipleRateLimits,
  getRateLimitStatus,
  resetRateLimit,
  RATE_LIMITS,
  type RateLimitConfig,
} from './service'
import {
  trackAbuseSignals,
  clearAbuseTracking,
  REQUEST_SIZE_LIMITS,
  TIMEOUT_LIMITS,
} from './middleware'
import {
  revokeApiKey,
  isApiKeyRevoked,
  unrevokeApiKey,
  revokeForAbuse,
  checkRevocation,
} from './revocation'
import { resetMockRedis } from '../lib/redis'

describe('Rate Limiting Service', () => {
  beforeEach(() => {
    resetMockRedis()
  })

  describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 5,
      windowSeconds: 60,
      keyPrefix: 'test:ratelimit',
    }

    it('allows requests under the limit', async () => {
      const result = await checkRateLimit('user-1', testConfig)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('decrements remaining on each request', async () => {
      await checkRateLimit('user-2', testConfig)
      await checkRateLimit('user-2', testConfig)
      const result = await checkRateLimit('user-2', testConfig)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('blocks requests over the limit', async () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('user-3', testConfig)
      }

      // 6th request should be blocked
      const result = await checkRateLimit('user-3', testConfig)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('separates limits by identifier', async () => {
      // Max out user-4
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('user-4', testConfig)
      }

      // user-5 should still be allowed
      const result = await checkRateLimit('user-5', testConfig)
      expect(result.allowed).toBe(true)
    })

    it('includes reset timestamp', async () => {
      const result = await checkRateLimit('user-6', testConfig)
      expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })

  describe('checkMultipleRateLimits', () => {
    it('returns most restrictive result', async () => {
      const strictConfig: RateLimitConfig = {
        maxRequests: 1,
        windowSeconds: 60,
        keyPrefix: 'test:strict',
      }

      const lenientConfig: RateLimitConfig = {
        maxRequests: 100,
        windowSeconds: 60,
        keyPrefix: 'test:lenient',
      }

      // First request uses up the strict limit
      await checkRateLimit('user-7', strictConfig)

      // Check both limits
      const result = await checkMultipleRateLimits([
        { identifier: 'user-7', config: strictConfig },
        { identifier: 'user-7', config: lenientConfig },
      ])

      expect(result.allowed).toBe(false)
      expect(result.limitType).toBe('test:strict')
    })
  })

  describe('getRateLimitStatus', () => {
    it('returns current status without incrementing', async () => {
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowSeconds: 60,
        keyPrefix: 'test:status',
      }

      await checkRateLimit('user-8', config)
      await checkRateLimit('user-8', config)

      const status = await getRateLimitStatus('user-8', config)
      expect(status.current).toBe(2)
      expect(status.limit).toBe(10)

      // Check again - should still be 2
      const status2 = await getRateLimitStatus('user-8', config)
      expect(status2.current).toBe(2)
    })
  })

  describe('resetRateLimit', () => {
    it('resets the rate limit counter', async () => {
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowSeconds: 60,
        keyPrefix: 'test:reset',
      }

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        await checkRateLimit('user-9', config)
      }

      // Verify blocked
      let result = await checkRateLimit('user-9', config)
      expect(result.allowed).toBe(false)

      // Reset
      await resetRateLimit('user-9', config)

      // Should be allowed again
      result = await checkRateLimit('user-9', config)
      expect(result.allowed).toBe(true)
    })
  })
})

describe('Abuse Detection', () => {
  beforeEach(() => {
    clearAbuseTracking()
  })

  describe('trackAbuseSignals', () => {
    it('returns no signals for normal usage', () => {
      const signals = trackAbuseSignals('key-1', 'kimi-k2.7', false, 0.01)
      expect(signals).toHaveLength(0)
    })

    it('detects rapid requests', () => {
      // Simulate 35 requests
      for (let i = 0; i < 35; i++) {
        trackAbuseSignals('key-2', 'kimi-k2.7', false, 0.001)
      }

      const signals = trackAbuseSignals('key-2', 'kimi-k2.7', false, 0.001)
      const rapidSignal = signals.find(s => s.type === 'rapid_requests')

      expect(rapidSignal).toBeDefined()
      expect(rapidSignal!.score).toBeGreaterThan(0)
    })

    it('detects error spikes', () => {
      // Simulate 12 consecutive errors
      for (let i = 0; i < 12; i++) {
        trackAbuseSignals('key-3', 'kimi-k2.7', true, 0)
      }

      const signals = trackAbuseSignals('key-3', 'kimi-k2.7', true, 0)
      const errorSignal = signals.find(s => s.type === 'error_spike')

      expect(errorSignal).toBeDefined()
    })

    it('detects unusual model switching', () => {
      const models = [
        'kimi-k2.7', 'gpt-4o', 'claude-sonnet-4', 'llama-4-maverick',
        'deepseek-v4-pro', 'qwen-3.5-72b', 'gemma-4-31b', 'mistral-small-4',
        'gpt-4o-mini', 'o3-mini', 'deepseek-r1', 'minimax-m3',
      ]

      for (const model of models) {
        trackAbuseSignals('key-4', model, false, 0.001)
      }

      const signals = trackAbuseSignals('key-4', 'kimi-k2.7', false, 0.001)
      const switchSignal = signals.find(s => s.type === 'unusual_model_switching')

      expect(switchSignal).toBeDefined()
    })

    it('detects cost anomalies', () => {
      // Simulate $15 in costs
      for (let i = 0; i < 15; i++) {
        trackAbuseSignals('key-5', 'gpt-4o', false, 1.0)
      }

      const signals = trackAbuseSignals('key-5', 'gpt-4o', false, 1.0)
      const costSignal = signals.find(s => s.type === 'cost_anomaly')

      expect(costSignal).toBeDefined()
    })

    it('resets error count on success', () => {
      // Build up errors
      for (let i = 0; i < 5; i++) {
        trackAbuseSignals('key-6', 'kimi-k2.7', true, 0)
      }

      // Success resets error count
      trackAbuseSignals('key-6', 'kimi-k2.7', false, 0.001)

      // More errors shouldn't trigger spike yet
      for (let i = 0; i < 5; i++) {
        trackAbuseSignals('key-6', 'kimi-k2.7', true, 0)
      }

      const signals = trackAbuseSignals('key-6', 'kimi-k2.7', true, 0)
      const errorSignal = signals.find(s => s.type === 'error_spike')

      // Should not detect spike because reset happened
      expect(errorSignal).toBeUndefined()
    })
  })
})

describe('API Key Revocation', () => {
  beforeEach(() => {
    resetMockRedis()
  })

  describe('revokeApiKey', () => {
    it('revokes an API key', async () => {
      await revokeApiKey('key-rev-1', {
        reason: 'abuse',
        details: 'Excessive requests',
        revokedAt: new Date().toISOString(),
      })

      const revoked = await isApiKeyRevoked('key-rev-1')
      expect(revoked).not.toBeNull()
      expect(revoked!.reason).toBe('abuse')
    })
  })

  describe('isApiKeyRevoked', () => {
    it('returns null for non-revoked keys', async () => {
      const revoked = await isApiKeyRevoked('key-not-revoked')
      expect(revoked).toBeNull()
    })

    it('returns reason for revoked keys', async () => {
      await revokeApiKey('key-rev-2', {
        reason: 'billing',
        details: 'Payment failed',
        revokedAt: new Date().toISOString(),
      })

      const revoked = await isApiKeyRevoked('key-rev-2')
      expect(revoked).not.toBeNull()
      expect(revoked!.reason).toBe('billing')
      expect(revoked!.details).toBe('Payment failed')
    })
  })

  describe('unrevokeApiKey', () => {
    it('restores a revoked key', async () => {
      await revokeApiKey('key-rev-3', {
        reason: 'admin',
        revokedAt: new Date().toISOString(),
      })

      // Verify revoked
      expect(await isApiKeyRevoked('key-rev-3')).not.toBeNull()

      // Unrevoke
      await unrevokeApiKey('key-rev-3')

      // Verify no longer revoked
      expect(await isApiKeyRevoked('key-rev-3')).toBeNull()
    })
  })

  describe('revokeForAbuse', () => {
    it('revokes with abuse reason', async () => {
      await revokeForAbuse('key-abuse', 'Rate limit exceeded repeatedly')

      const revoked = await isApiKeyRevoked('key-abuse')
      expect(revoked!.reason).toBe('abuse')
      expect(revoked!.revokedBy).toBe('system')
    })
  })

  describe('checkRevocation', () => {
    it('returns revoked status', async () => {
      const result1 = await checkRevocation('key-check-1')
      expect(result1.revoked).toBe(false)

      await revokeApiKey('key-check-1', {
        reason: 'security',
        revokedAt: new Date().toISOString(),
      })

      const result2 = await checkRevocation('key-check-1')
      expect(result2.revoked).toBe(true)
      expect(result2.reason!.reason).toBe('security')
    })
  })
})

describe('Size and Timeout Limits', () => {
  it('has reasonable request size limits', () => {
    expect(REQUEST_SIZE_LIMITS.maxBodySize).toBe(10 * 1024 * 1024) // 10 MB
    expect(REQUEST_SIZE_LIMITS.maxMessageLength).toBe(100000)
    expect(REQUEST_SIZE_LIMITS.maxMessages).toBe(100)
  })

  it('has reasonable timeout limits', () => {
    expect(TIMEOUT_LIMITS.defaultTimeout).toBe(120000) // 2 minutes
    expect(TIMEOUT_LIMITS.streamingTimeout).toBe(300000) // 5 minutes
  })
})

describe('Default Rate Limits', () => {
  it('has per-key limit of 60 req/min', () => {
    expect(RATE_LIMITS.perKey.maxRequests).toBe(60)
    expect(RATE_LIMITS.perKey.windowSeconds).toBe(60)
  })

  it('has per-IP limit of 100 req/min', () => {
    expect(RATE_LIMITS.perIp.maxRequests).toBe(100)
    expect(RATE_LIMITS.perIp.windowSeconds).toBe(60)
  })

  it('has global limit of 10000 req/min', () => {
    expect(RATE_LIMITS.global.maxRequests).toBe(10000)
    expect(RATE_LIMITS.global.windowSeconds).toBe(60)
  })
})
