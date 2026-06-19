import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkAndReserveBudget,
  finalizeBudget,
  releaseBudget,
  getBudgetStatus,
  resetAllBudgets,
} from './service'
import type { APIKeyData } from '../auth/api-key'

// Test API key
const createTestKey = (overrides: Partial<APIKeyData> = {}): APIKeyData => ({
  id: 'test-key-' + Math.random().toString(36).substring(7),
  keyHash: 'test-hash',
  name: 'Test Key',
  dailyLimitUsd: 10.0,
  taskLimitUsd: null,
  totalLimitUsd: 100.0,
  isActive: true,
  createdAt: new Date(),
  ...overrides,
})

describe('Budget Service', () => {
  beforeEach(() => {
    resetAllBudgets()
  })

  describe('checkAndReserveBudget', () => {
    it('allows request within budget', async () => {
      const apiKey = createTestKey()
      const result = await checkAndReserveBudget(apiKey, 1.0, 'req-1')

      expect(result.allowed).toBe(true)
      expect(result.dailySpent).toBe(1.0)
      expect(result.reservationId).toBe('req-1')
    })

    it('rejects request exceeding daily limit', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 5.0 })

      // First request
      await checkAndReserveBudget(apiKey, 4.0, 'req-1')

      // Second request should fail
      const result = await checkAndReserveBudget(apiKey, 2.0, 'req-2')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_limit_exceeded')
    })

    it('rejects request exceeding total limit', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 100.0, totalLimitUsd: 5.0 })

      // First request
      await checkAndReserveBudget(apiKey, 4.0, 'req-1')

      // Second request should fail
      const result = await checkAndReserveBudget(apiKey, 2.0, 'req-2')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('total_limit_exceeded')
    })

    it('rejects inactive API key', async () => {
      const apiKey = createTestKey({ isActive: false })
      const result = await checkAndReserveBudget(apiKey, 1.0, 'req-1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('key_inactive')
    })

    it('tracks budget across multiple requests', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 10.0 })

      await checkAndReserveBudget(apiKey, 2.0, 'req-1')
      await checkAndReserveBudget(apiKey, 3.0, 'req-2')
      const result = await checkAndReserveBudget(apiKey, 4.0, 'req-3')

      expect(result.allowed).toBe(true)
      expect(result.dailySpent).toBe(9.0)

      // Next one should fail
      const fail = await checkAndReserveBudget(apiKey, 2.0, 'req-4')
      expect(fail.allowed).toBe(false)
    })
  })

  describe('finalizeBudget', () => {
    it('adjusts budget when actual cost is less than reserved', async () => {
      const apiKey = createTestKey()

      await checkAndReserveBudget(apiKey, 5.0, 'req-1')
      await finalizeBudget(apiKey, 'req-1', 3.0) // Actual cost was less

      const status = await getBudgetStatus(apiKey)
      expect(status.dailySpent).toBe(3.0) // Should be actual cost
    })

    it('adjusts budget when actual cost is more than reserved', async () => {
      const apiKey = createTestKey()

      await checkAndReserveBudget(apiKey, 2.0, 'req-1')
      await finalizeBudget(apiKey, 'req-1', 3.0) // Actual cost was more

      const status = await getBudgetStatus(apiKey)
      expect(status.dailySpent).toBe(3.0) // Should be actual cost
    })
  })

  describe('releaseBudget', () => {
    it('fully releases reserved budget on failure', async () => {
      const apiKey = createTestKey()

      await checkAndReserveBudget(apiKey, 5.0, 'req-1')
      await releaseBudget(apiKey, 'req-1')

      const status = await getBudgetStatus(apiKey)
      expect(status.dailySpent).toBe(0)
    })
  })

  describe('getBudgetStatus', () => {
    it('returns current budget status', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 10.0, totalLimitUsd: 100.0 })

      await checkAndReserveBudget(apiKey, 3.0, 'req-1')
      await finalizeBudget(apiKey, 'req-1', 3.0)

      const status = await getBudgetStatus(apiKey)

      expect(status.dailySpent).toBe(3.0)
      expect(status.dailyLimit).toBe(10.0)
      expect(status.dailyRemaining).toBe(7.0)
      expect(status.totalSpent).toBe(3.0)
      expect(status.totalLimit).toBe(100.0)
      expect(status.totalRemaining).toBe(97.0)
    })
  })

  describe('Concurrency Tests', () => {
    it('handles 100 concurrent requests without overspend', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 10.0 })
      const costPerRequest = 0.1

      // Launch 100 concurrent requests
      const requests = Array.from({ length: 100 }, (_, i) =>
        checkAndReserveBudget(apiKey, costPerRequest, `req-${i}`)
      )

      const results = await Promise.all(requests)

      // Count allowed and rejected
      const allowed = results.filter((r) => r.allowed).length
      const rejected = results.filter((r) => !r.allowed).length

      // With $10 limit and $0.1 per request, exactly 100 should be allowed
      expect(allowed).toBe(100)
      expect(rejected).toBe(0)

      // Verify total spent (use toBeCloseTo for floating point precision)
      const status = await getBudgetStatus(apiKey)
      expect(status.dailySpent).toBeCloseTo(10.0, 10) // Exactly at limit
    })

    it('prevents overspend with concurrent requests at limit boundary', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 5.0 })

      // Use up most of the budget
      await checkAndReserveBudget(apiKey, 4.5, 'req-0')
      await finalizeBudget(apiKey, 'req-0', 4.5)

      // Now launch 10 concurrent requests each trying to spend $1
      const requests = Array.from({ length: 10 }, (_, i) =>
        checkAndReserveBudget(apiKey, 1.0, `req-${i + 1}`)
      )

      const results = await Promise.all(requests)

      // Only should allow requests that fit in remaining $0.5
      const allowed = results.filter((r) => r.allowed).length

      // With $0.5 remaining and $1.0 per request, none should be allowed
      // (since each request tries to spend more than available)
      expect(allowed).toBe(0)

      // Verify no overspend
      const status = await getBudgetStatus(apiKey)
      expect(status.dailySpent).toBeLessThanOrEqual(5.0)
    })

    it('handles mixed concurrent reserve/finalize operations', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 100.0 })

      // Simulate real traffic: reserve, finalize, reserve, finalize...
      const operations: Promise<void>[] = []

      for (let i = 0; i < 50; i++) {
        operations.push(
          (async () => {
            const reqId = `req-${i}`
            const result = await checkAndReserveBudget(apiKey, 1.0, reqId)
            if (result.allowed) {
              // Simulate some work
              await new Promise((r) => setTimeout(r, Math.random() * 10))
              await finalizeBudget(apiKey, reqId, 0.8) // Actual was less
            }
          })()
        )
      }

      await Promise.all(operations)

      const status = await getBudgetStatus(apiKey)

      // 50 requests * $0.8 actual = $40 (use toBeCloseTo for floating point precision)
      expect(status.dailySpent).toBeCloseTo(40.0, 10)
    })
  })

  describe('Bypass Prevention Tests', () => {
    it('cannot bypass by using same request ID twice', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 10.0 })

      // First reservation
      await checkAndReserveBudget(apiKey, 5.0, 'req-1')

      // Try to reserve again with same ID (simulating replay attack)
      const result = await checkAndReserveBudget(apiKey, 5.0, 'req-1')

      // Should still be tracked (total reserved = $10)
      expect(result.allowed).toBe(true) // But budget is now at limit

      // Third request should fail
      const third = await checkAndReserveBudget(apiKey, 1.0, 'req-2')
      expect(third.allowed).toBe(false)
    })

    it('cannot bypass by releasing without reservation', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 10.0 })

      // Use up budget
      await checkAndReserveBudget(apiKey, 10.0, 'req-1')
      await finalizeBudget(apiKey, 'req-1', 10.0)

      // Try to release a non-existent reservation
      await releaseBudget(apiKey, 'fake-req')

      // Budget should still be at limit
      const status = await getBudgetStatus(apiKey)
      expect(status.dailySpent).toBe(10.0)
    })

    it('cannot bypass by finalizing with negative cost', async () => {
      const apiKey = createTestKey({ dailyLimitUsd: 10.0 })

      // Reserve and finalize with negative cost
      await checkAndReserveBudget(apiKey, 5.0, 'req-1')
      await finalizeBudget(apiKey, 'req-1', -5.0) // Trying to "earn" money

      // The implementation should handle this correctly
      // (negative adjustments would increase spent, making things worse for attacker)
      const status = await getBudgetStatus(apiKey)

      // Depending on implementation, this should either:
      // 1. Treat negative as 0
      // 2. Actually deduct (making spent negative, which doesn't help bypass)
      // Either way, they can't increase their remaining budget beyond what's fair
      expect(status.dailyRemaining).toBeLessThanOrEqual(10.0)
    })

    it('isolates budgets between different API keys', async () => {
      const apiKey1 = createTestKey({ id: 'key-1', dailyLimitUsd: 10.0 })
      const apiKey2 = createTestKey({ id: 'key-2', dailyLimitUsd: 10.0 })

      // Use up key1's budget
      await checkAndReserveBudget(apiKey1, 10.0, 'req-1')
      await finalizeBudget(apiKey1, 'req-1', 10.0)

      // Key2 should still have full budget
      const result = await checkAndReserveBudget(apiKey2, 5.0, 'req-2')
      expect(result.allowed).toBe(true)

      const status1 = await getBudgetStatus(apiKey1)
      const status2 = await getBudgetStatus(apiKey2)

      expect(status1.dailyRemaining).toBe(0)
      expect(status2.dailyRemaining).toBe(5.0)
    })
  })
})
