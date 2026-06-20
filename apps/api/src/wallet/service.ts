import { getRedisClient } from '../lib/redis'
import { getUsdcBalance } from './chain'

// Redis key prefixes
const WALLET_KEY_PREFIX = 'wallet:address:'
const API_KEY_PREFIX = 'apikey:'

export interface WalletInfo {
  address: string
  apiKeyHash: string
  createdAt: number
}

export interface WalletBalance {
  address: string
  balanceUsdc: number
  pendingCharges: number
  availableUsdc: number
}

/**
 * Register a wallet address with an API key hash.
 * Called after successful SIWE authentication.
 */
export async function registerWallet(
  address: string,
  apiKeyHash: string
): Promise<WalletInfo> {
  const redis = getRedisClient()
  const normalizedAddress = address.toLowerCase()

  const walletInfo: WalletInfo = {
    address: normalizedAddress,
    apiKeyHash,
    createdAt: Date.now(),
  }

  // Store wallet info by address
  await redis.set(
    `${WALLET_KEY_PREFIX}${normalizedAddress}`,
    JSON.stringify(walletInfo)
  )

  // Store API key hash -> address mapping for auth lookup
  await redis.set(`${API_KEY_PREFIX}${apiKeyHash}`, normalizedAddress)

  return walletInfo
}

/**
 * Get wallet by address.
 */
export async function getWalletByAddress(address: string): Promise<WalletInfo | null> {
  const redis = getRedisClient()
  const normalizedAddress = address.toLowerCase()

  const data = await redis.get(`${WALLET_KEY_PREFIX}${normalizedAddress}`)
  if (!data) return null

  return JSON.parse(data) as WalletInfo
}

/**
 * Get wallet address by API key hash.
 * Used for authenticating API requests.
 */
export async function getAddressByApiKeyHash(apiKeyHash: string): Promise<string | null> {
  const redis = getRedisClient()
  return redis.get(`${API_KEY_PREFIX}${apiKeyHash}`)
}

/**
 * Get wallet balance including pending charges.
 */
export async function getWalletBalance(address: string): Promise<WalletBalance | null> {
  const normalizedAddress = address.toLowerCase()
  const wallet = await getWalletByAddress(normalizedAddress)
  if (!wallet) return null

  const redis = getRedisClient()

  // Get on-chain USDC balance
  const balanceUsdc = await getUsdcBalance(normalizedAddress)

  // Get pending charges (reserved but not yet settled)
  const pendingKey = `wallet:pending:${normalizedAddress}`
  const pendingStr = await redis.get(pendingKey)
  const pendingCharges = pendingStr ? parseFloat(pendingStr) : 0

  return {
    address: normalizedAddress,
    balanceUsdc,
    pendingCharges,
    availableUsdc: Math.max(0, balanceUsdc - pendingCharges),
  }
}

/**
 * Reserve funds for a request (before processing).
 * Returns true if sufficient balance, false otherwise.
 */
export async function reserveFunds(
  address: string,
  estimatedCostUsd: number,
  requestId: string
): Promise<{ success: boolean; reason?: string }> {
  const normalizedAddress = address.toLowerCase()
  const balance = await getWalletBalance(normalizedAddress)

  if (!balance) {
    return { success: false, reason: 'wallet_not_found' }
  }

  if (balance.availableUsdc < estimatedCostUsd) {
    return { success: false, reason: 'insufficient_balance' }
  }

  const redis = getRedisClient()

  // Add to pending charges atomically
  const pendingKey = `wallet:pending:${normalizedAddress}`
  await redis.incrbyfloat(pendingKey, estimatedCostUsd)

  // Store reservation for this request (5 min expiry)
  const reservationKey = `wallet:reserve:${normalizedAddress}:${requestId}`
  await redis.set(reservationKey, estimatedCostUsd.toString(), 'EX', 300)

  return { success: true }
}

/**
 * Settle funds after request completes.
 * Records the charge for later on-chain settlement.
 * In production, this triggers the escrow contract.
 */
export async function settleFunds(
  address: string,
  requestId: string,
  actualCostUsd: number
): Promise<{ success: boolean; error?: string }> {
  const normalizedAddress = address.toLowerCase()
  const redis = getRedisClient()

  const reservationKey = `wallet:reserve:${normalizedAddress}:${requestId}`
  const pendingKey = `wallet:pending:${normalizedAddress}`

  // Get reserved amount
  const reservedStr = await redis.get(reservationKey)
  const reservedAmount = reservedStr ? parseFloat(reservedStr) : 0

  // Release the reservation from pending
  if (reservedAmount > 0) {
    await redis.incrbyfloat(pendingKey, -reservedAmount)
  }

  // Clean up reservation
  await redis.del(reservationKey)

  // Track the charge for batching/settlement
  const chargesKey = `wallet:charges:${normalizedAddress}`
  await redis.incrbyfloat(chargesKey, actualCostUsd)

  // Record usage
  const usageKey = `wallet:usage:${normalizedAddress}`
  const usage = {
    requestId,
    amount: actualCostUsd,
    timestamp: Date.now(),
  }
  await redis.lpush(usageKey, JSON.stringify(usage))
  await redis.ltrim(usageKey, 0, 999) // Keep last 1000

  return { success: true }
}

/**
 * Release reserved funds (on request failure).
 */
export async function releaseFunds(address: string, requestId: string): Promise<void> {
  const normalizedAddress = address.toLowerCase()
  const redis = getRedisClient()

  const reservationKey = `wallet:reserve:${normalizedAddress}:${requestId}`
  const pendingKey = `wallet:pending:${normalizedAddress}`

  // Get reserved amount
  const reservedStr = await redis.get(reservationKey)
  const reservedAmount = reservedStr ? parseFloat(reservedStr) : 0

  // Release from pending
  if (reservedAmount > 0) {
    await redis.incrbyfloat(pendingKey, -reservedAmount)
  }

  // Clean up reservation
  await redis.del(reservationKey)
}

/**
 * Get accumulated charges for a wallet (for batched settlement).
 */
export async function getAccumulatedCharges(address: string): Promise<number> {
  const normalizedAddress = address.toLowerCase()
  const redis = getRedisClient()

  const chargesKey = `wallet:charges:${normalizedAddress}`
  const chargesStr = await redis.get(chargesKey)

  return chargesStr ? parseFloat(chargesStr) : 0
}

/**
 * Clear accumulated charges after on-chain settlement.
 */
export async function clearAccumulatedCharges(address: string): Promise<void> {
  const normalizedAddress = address.toLowerCase()
  const redis = getRedisClient()

  const chargesKey = `wallet:charges:${normalizedAddress}`
  await redis.set(chargesKey, '0')
}

/**
 * Get usage history for a wallet.
 */
export async function getUsageHistory(
  address: string,
  limit = 100
): Promise<Array<{ requestId: string; amount: number; timestamp: number }>> {
  const normalizedAddress = address.toLowerCase()
  const redis = getRedisClient()

  const usageKey = `wallet:usage:${normalizedAddress}`
  const usage = await redis.lrange(usageKey, 0, limit - 1)

  return usage.map((s) => JSON.parse(s))
}
