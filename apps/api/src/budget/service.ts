import { getRedisClient, resetMockRedis } from '../lib/redis'
import type { APIKeyData } from '../auth/api-key'

// Budget keys in Redis
const DAILY_KEY_PREFIX = 'budget:daily:'
const TOTAL_KEY_PREFIX = 'budget:total:'
const RESERVATION_PREFIX = 'budget:reserve:'

// Get today's date string for daily budget key
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD
}

// Build Redis keys for an API key
function getBudgetKeys(apiKeyId: string): { dailyKey: string; totalKey: string } {
  const today = getTodayKey()
  return {
    dailyKey: `${DAILY_KEY_PREFIX}${apiKeyId}:${today}`,
    totalKey: `${TOTAL_KEY_PREFIX}${apiKeyId}`,
  }
}

// Reservation ID for tracking in-flight requests
function getReservationKey(apiKeyId: string, requestId: string): string {
  return `${RESERVATION_PREFIX}${apiKeyId}:${requestId}`
}

export interface BudgetCheckResult {
  allowed: boolean
  reason?: 'daily_limit_exceeded' | 'total_limit_exceeded' | 'key_inactive'
  dailySpent: number
  dailyLimit: number
  totalSpent: number
  totalLimit: number
  reservationId?: string
}

export interface BudgetReservation {
  apiKeyId: string
  requestId: string
  reservedAmount: number
  createdAt: Date
}

/**
 * Check if a request is within budget and reserve the estimated amount.
 * This is atomic to prevent race conditions with concurrent requests.
 *
 * @param apiKey - The API key data
 * @param estimatedCostUsd - Estimated cost for this request
 * @param requestId - Unique ID for this request (for reservation tracking)
 */
export async function checkAndReserveBudget(
  apiKey: APIKeyData,
  estimatedCostUsd: number,
  requestId: string
): Promise<BudgetCheckResult> {
  if (!apiKey.isActive) {
    return {
      allowed: false,
      reason: 'key_inactive',
      dailySpent: 0,
      dailyLimit: apiKey.dailyLimitUsd,
      totalSpent: 0,
      totalLimit: apiKey.totalLimitUsd || 0,
    }
  }

  const redis = getRedisClient()
  const { dailyKey, totalKey } = getBudgetKeys(apiKey.id)

  // Use Lua script for atomic check-and-reserve
  // This prevents race conditions where multiple requests check budget simultaneously
  const result = await redis.eval(
    `-- budget:check_and_reserve
    local dailyKey = KEYS[1]
    local totalKey = KEYS[2]
    local dailyLimit = tonumber(ARGV[1])
    local totalLimit = tonumber(ARGV[2])
    local reserveAmount = tonumber(ARGV[3])

    local dailySpent = tonumber(redis.call('GET', dailyKey) or '0')
    local totalSpent = tonumber(redis.call('GET', totalKey) or '0')

    -- Check daily limit
    if dailyLimit > 0 and (dailySpent + reserveAmount) > dailyLimit then
      return {0, 'daily_limit_exceeded', dailySpent, totalSpent}
    end

    -- Check total limit
    if totalLimit > 0 and (totalSpent + reserveAmount) > totalLimit then
      return {0, 'total_limit_exceeded', dailySpent, totalSpent}
    end

    -- Reserve the amount atomically
    redis.call('INCRBYFLOAT', dailyKey, reserveAmount)
    redis.call('INCRBYFLOAT', totalKey, reserveAmount)

    -- Set expiry on daily key (end of day + buffer)
    redis.call('EXPIRE', dailyKey, 90000) -- 25 hours

    return {1, 'ok', dailySpent + reserveAmount, totalSpent + reserveAmount}
    `,
    2,
    dailyKey,
    totalKey,
    apiKey.dailyLimitUsd.toString(),
    (apiKey.totalLimitUsd || 0).toString(),
    estimatedCostUsd.toString()
  ) as [number, string, number, number]

  const [allowed, reason, dailySpent, totalSpent] = result

  if (allowed === 1) {
    // Store reservation for later settlement
    const reservationKey = getReservationKey(apiKey.id, requestId)
    await redis.set(reservationKey, estimatedCostUsd.toString(), 'EX', 300) // 5 min expiry

    return {
      allowed: true,
      dailySpent,
      dailyLimit: apiKey.dailyLimitUsd,
      totalSpent,
      totalLimit: apiKey.totalLimitUsd || 0,
      reservationId: requestId,
    }
  }

  return {
    allowed: false,
    reason: reason as BudgetCheckResult['reason'],
    dailySpent,
    dailyLimit: apiKey.dailyLimitUsd,
    totalSpent,
    totalLimit: apiKey.totalLimitUsd || 0,
  }
}

/**
 * Finalize the budget after a request completes.
 * Adjusts the reservation to the actual cost.
 */
export async function finalizeBudget(
  apiKey: APIKeyData,
  requestId: string,
  actualCostUsd: number
): Promise<void> {
  const redis = getRedisClient()
  const { dailyKey, totalKey } = getBudgetKeys(apiKey.id)
  const reservationKey = getReservationKey(apiKey.id, requestId)

  // Prevent negative costs (security: attacker can't "earn" money)
  const safeCost = Math.max(0, actualCostUsd)

  // Get reserved amount
  const reservedStr = await redis.get(reservationKey)
  if (!reservedStr) {
    // No reservation found - this shouldn't happen in normal flow
    // Just add the actual cost
    await redis.incrbyfloat(dailyKey, safeCost)
    await redis.incrbyfloat(totalKey, safeCost)
    return
  }

  const reservedAmount = parseFloat(reservedStr)
  const diff = reservedAmount - safeCost

  // Adjust budget: release unused reservation or charge extra
  await redis.eval(
    `-- budget:deduct
    local dailyKey = KEYS[1]
    local totalKey = KEYS[2]
    local diff = tonumber(ARGV[1])

    -- If diff > 0, we reserved too much, release the excess
    -- If diff < 0, we need to charge more (shouldn't happen with good estimates)
    if diff ~= 0 then
      redis.call('INCRBYFLOAT', dailyKey, -diff)
      redis.call('INCRBYFLOAT', totalKey, -diff)
    end

    return 1
    `,
    2,
    dailyKey,
    totalKey,
    diff.toString()
  )

  // Clean up reservation
  await redis.del(reservationKey)
}

/**
 * Release a budget reservation (e.g., if request fails before completion).
 */
export async function releaseBudget(
  apiKey: APIKeyData,
  requestId: string
): Promise<void> {
  const redis = getRedisClient()
  const { dailyKey, totalKey } = getBudgetKeys(apiKey.id)
  const reservationKey = getReservationKey(apiKey.id, requestId)

  // Get reserved amount
  const reservedStr = await redis.get(reservationKey)
  if (!reservedStr) return

  const reservedAmount = parseFloat(reservedStr)

  // Release the full reservation
  await redis.eval(
    `-- budget:release
    local dailyKey = KEYS[1]
    local totalKey = KEYS[2]
    local amount = tonumber(ARGV[1])

    redis.call('INCRBYFLOAT', dailyKey, -amount)
    redis.call('INCRBYFLOAT', totalKey, -amount)

    return 1
    `,
    2,
    dailyKey,
    totalKey,
    reservedAmount.toString()
  )

  // Clean up reservation
  await redis.del(reservationKey)
}

/**
 * Get current budget status for an API key.
 */
export async function getBudgetStatus(apiKey: APIKeyData): Promise<{
  dailySpent: number
  dailyLimit: number
  dailyRemaining: number
  totalSpent: number
  totalLimit: number
  totalRemaining: number
}> {
  const redis = getRedisClient()
  const { dailyKey, totalKey } = getBudgetKeys(apiKey.id)

  const [dailyStr, totalStr] = await Promise.all([
    redis.get(dailyKey),
    redis.get(totalKey),
  ])

  const dailySpent = parseFloat(dailyStr || '0')
  const totalSpent = parseFloat(totalStr || '0')

  return {
    dailySpent,
    dailyLimit: apiKey.dailyLimitUsd,
    dailyRemaining: Math.max(0, apiKey.dailyLimitUsd - dailySpent),
    totalSpent,
    totalLimit: apiKey.totalLimitUsd || 0,
    totalRemaining: apiKey.totalLimitUsd
      ? Math.max(0, apiKey.totalLimitUsd - totalSpent)
      : Infinity,
  }
}

/**
 * Reset budget for testing.
 */
export async function resetBudget(apiKeyId: string): Promise<void> {
  const redis = getRedisClient()
  const { dailyKey, totalKey } = getBudgetKeys(apiKeyId)

  await Promise.all([
    redis.del(dailyKey),
    redis.del(totalKey),
  ])
}

/**
 * Reset all budgets (for testing).
 */
export function resetAllBudgets(): void {
  resetMockRedis()
}
