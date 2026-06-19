import { getRedisClient } from '../lib/redis'
import {
  createWallet,
  getUsdcBalance,
  transferToTreasury,
  transferUsdc,
  getWallet,
  type WalletInfo,
} from './privy'

// Redis key prefixes
const WALLET_KEY_PREFIX = 'wallet:'
const USER_WALLET_PREFIX = 'user:wallet:'

export interface UserWallet {
  walletId: string
  address: string
  userId: string
  createdAt: number
}

export interface WalletBalance {
  address: string
  balanceUsdc: number
  pendingCharges: number
  availableUsdc: number
}

/**
 * Create a wallet for a user and store the mapping.
 */
export async function createUserWallet(userId: string): Promise<UserWallet> {
  const redis = getRedisClient()

  // Check if user already has a wallet
  const existingWalletId = await redis.get(`${USER_WALLET_PREFIX}${userId}`)
  if (existingWalletId) {
    const existing = await getUserWallet(userId)
    if (existing) return existing
  }

  // Create new wallet via Privy
  const wallet = await createWallet(userId)

  const userWallet: UserWallet = {
    walletId: wallet.id,
    address: wallet.address,
    userId,
    createdAt: wallet.createdAt,
  }

  // Store wallet info
  await redis.set(`${WALLET_KEY_PREFIX}${wallet.id}`, JSON.stringify(userWallet))
  await redis.set(`${USER_WALLET_PREFIX}${userId}`, wallet.id)

  return userWallet
}

/**
 * Get a user's wallet.
 */
export async function getUserWallet(userId: string): Promise<UserWallet | null> {
  const redis = getRedisClient()

  const walletId = await redis.get(`${USER_WALLET_PREFIX}${userId}`)
  if (!walletId) return null

  const walletData = await redis.get(`${WALLET_KEY_PREFIX}${walletId}`)
  if (!walletData) return null

  return JSON.parse(walletData) as UserWallet
}

/**
 * Get wallet by wallet ID.
 */
export async function getWalletById(walletId: string): Promise<UserWallet | null> {
  const redis = getRedisClient()

  const walletData = await redis.get(`${WALLET_KEY_PREFIX}${walletId}`)
  if (!walletData) return null

  return JSON.parse(walletData) as UserWallet
}

/**
 * Get wallet balance including pending charges.
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  const wallet = await getUserWallet(userId)
  if (!wallet) return null

  const redis = getRedisClient()

  // Get on-chain USDC balance
  const balanceUsdc = await getUsdcBalance(wallet.address)

  // Get pending charges (reserved but not yet settled)
  const pendingKey = `wallet:pending:${wallet.walletId}`
  const pendingStr = await redis.get(pendingKey)
  const pendingCharges = pendingStr ? parseFloat(pendingStr) : 0

  return {
    address: wallet.address,
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
  userId: string,
  estimatedCostUsd: number,
  requestId: string
): Promise<{ success: boolean; reason?: string }> {
  const balance = await getWalletBalance(userId)
  if (!balance) {
    return { success: false, reason: 'wallet_not_found' }
  }

  if (balance.availableUsdc < estimatedCostUsd) {
    return { success: false, reason: 'insufficient_balance' }
  }

  const wallet = await getUserWallet(userId)
  if (!wallet) {
    return { success: false, reason: 'wallet_not_found' }
  }

  const redis = getRedisClient()

  // Add to pending charges
  const pendingKey = `wallet:pending:${wallet.walletId}`
  await redis.incrbyfloat(pendingKey, estimatedCostUsd)

  // Store reservation for this request
  const reservationKey = `wallet:reserve:${wallet.walletId}:${requestId}`
  await redis.set(reservationKey, estimatedCostUsd.toString(), 'EX', 300) // 5 min expiry

  return { success: true }
}

/**
 * Settle funds after request completes.
 * Transfers actual cost to treasury.
 */
export async function settleFunds(
  userId: string,
  requestId: string,
  actualCostUsd: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const wallet = await getUserWallet(userId)
  if (!wallet) {
    return { success: false, error: 'wallet_not_found' }
  }

  const redis = getRedisClient()
  const reservationKey = `wallet:reserve:${wallet.walletId}:${requestId}`
  const pendingKey = `wallet:pending:${wallet.walletId}`

  // Get reserved amount
  const reservedStr = await redis.get(reservationKey)
  const reservedAmount = reservedStr ? parseFloat(reservedStr) : 0

  // Release the reservation from pending
  if (reservedAmount > 0) {
    await redis.incrbyfloat(pendingKey, -reservedAmount)
  }

  // Clean up reservation
  await redis.del(reservationKey)

  // Skip actual transfer for very small amounts (batch later)
  // Or if in test mode
  if (actualCostUsd < 0.001 || process.env.NODE_ENV === 'test' || !process.env.PRIVY_APP_ID) {
    // Just track the charge for later batching
    const chargesKey = `wallet:charges:${wallet.walletId}`
    await redis.incrbyfloat(chargesKey, actualCostUsd)
    return { success: true, txHash: 'batched' }
  }

  try {
    // Transfer actual cost to treasury
    const { hash } = await transferToTreasury(wallet.walletId, actualCostUsd)

    // Record the settlement
    const settlementsKey = `wallet:settlements:${wallet.walletId}`
    const settlement = {
      requestId,
      amount: actualCostUsd,
      txHash: hash,
      timestamp: Date.now(),
    }
    await redis.lpush(settlementsKey, JSON.stringify(settlement))
    await redis.ltrim(settlementsKey, 0, 999) // Keep last 1000

    return { success: true, txHash: hash }
  } catch (error) {
    // If transfer fails, add back to pending for retry
    await redis.incrbyfloat(pendingKey, actualCostUsd)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    }
  }
}

/**
 * Release reserved funds (on request failure).
 */
export async function releaseFunds(userId: string, requestId: string): Promise<void> {
  const wallet = await getUserWallet(userId)
  if (!wallet) return

  const redis = getRedisClient()
  const reservationKey = `wallet:reserve:${wallet.walletId}:${requestId}`
  const pendingKey = `wallet:pending:${wallet.walletId}`

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
 * Withdraw USDC to an external address.
 */
export async function withdraw(
  userId: string,
  recipientAddress: string,
  amountUsd: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const wallet = await getUserWallet(userId)
  if (!wallet) {
    return { success: false, error: 'wallet_not_found' }
  }

  const balance = await getWalletBalance(userId)
  if (!balance || balance.availableUsdc < amountUsd) {
    return { success: false, error: 'insufficient_balance' }
  }

  try {
    const { hash } = await transferUsdc(wallet.walletId, recipientAddress, amountUsd)
    return { success: true, txHash: hash }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Withdrawal failed',
    }
  }
}

/**
 * Get settlement history for a wallet.
 */
export async function getSettlementHistory(
  userId: string,
  limit = 100
): Promise<Array<{ requestId: string; amount: number; txHash: string; timestamp: number }>> {
  const wallet = await getUserWallet(userId)
  if (!wallet) return []

  const redis = getRedisClient()
  const settlementsKey = `wallet:settlements:${wallet.walletId}`

  const settlements = await redis.lrange(settlementsKey, 0, limit - 1)
  return settlements.map((s) => JSON.parse(s))
}
