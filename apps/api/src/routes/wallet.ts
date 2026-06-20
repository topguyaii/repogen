import { Hono } from 'hono'
import { Errors } from '../middleware/error-handler'
import {
  getWalletBalance,
  getUsageHistory,
  getAccumulatedCharges,
} from '../wallet/service'
import type { APIKeyData } from '../auth/api-key'

const app = new Hono()

/**
 * Get wallet info and balance.
 * With wallet-native auth, the wallet address is tied to the API key.
 *
 * GET /v1/wallet
 */
app.get('/', async (c) => {
  const apiKey = c.get('apiKey') as APIKeyData & { walletAddress?: string }

  if (!apiKey.walletAddress) {
    throw Errors.invalidRequest('No wallet associated with this API key. Please authenticate with SIWE first.', null)
  }

  const balance = await getWalletBalance(apiKey.walletAddress)
  const pendingCharges = await getAccumulatedCharges(apiKey.walletAddress)

  return c.json({
    wallet: {
      address: apiKey.walletAddress,
    },
    balance: {
      usdc: balance?.balanceUsdc || 0,
      pending: balance?.pendingCharges || 0,
      available: balance?.availableUsdc || 0,
    },
    accumulated_charges: pendingCharges,
    deposit_instructions: {
      network: 'Base',
      token: 'USDC',
      address: apiKey.walletAddress,
      note: 'Send USDC on Base network to this address. Funds will be available immediately.',
    },
  })
})

/**
 * Get usage history.
 * Shows past API requests and their costs.
 *
 * GET /v1/wallet/usage
 */
app.get('/usage', async (c) => {
  const apiKey = c.get('apiKey') as APIKeyData & { walletAddress?: string }

  if (!apiKey.walletAddress) {
    throw Errors.invalidRequest('No wallet associated with this API key.', null)
  }

  const limit = parseInt(c.req.query('limit') || '100', 10)
  const history = await getUsageHistory(apiKey.walletAddress, Math.min(limit, 1000))

  return c.json({
    usage: history.map((u) => ({
      request_id: u.requestId,
      amount_usdc: u.amount,
      timestamp: new Date(u.timestamp).toISOString(),
    })),
    count: history.length,
    total_spent: history.reduce((sum, u) => sum + u.amount, 0),
  })
})

/**
 * Get accumulated charges (for settlement reference).
 *
 * GET /v1/wallet/charges
 */
app.get('/charges', async (c) => {
  const apiKey = c.get('apiKey') as APIKeyData & { walletAddress?: string }

  if (!apiKey.walletAddress) {
    throw Errors.invalidRequest('No wallet associated with this API key.', null)
  }

  const accumulated = await getAccumulatedCharges(apiKey.walletAddress)

  return c.json({
    wallet: apiKey.walletAddress,
    accumulated_charges_usdc: accumulated,
    note: 'These charges will be settled when you deposit to the escrow contract.',
  })
})

export { app as wallet }
