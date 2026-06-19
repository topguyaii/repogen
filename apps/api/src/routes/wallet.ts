import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Errors } from '../middleware/error-handler'
import {
  createUserWallet,
  getUserWallet,
  getWalletBalance,
  withdraw,
  getSettlementHistory,
} from '../wallet/service'
import type { APIKeyData } from '../auth/api-key'

const app = new Hono()

// Get wallet info and balance
// GET /v1/wallet
app.get('/', async (c) => {
  const apiKey = c.get('apiKey') as APIKeyData

  const wallet = await getUserWallet(apiKey.id)

  if (!wallet) {
    // Auto-create wallet if it doesn't exist
    const newWallet = await createUserWallet(apiKey.id)
    const balance = await getWalletBalance(apiKey.id)

    return c.json({
      wallet: {
        address: newWallet.address,
        created_at: new Date(newWallet.createdAt).toISOString(),
      },
      balance: {
        usdc: balance?.balanceUsdc || 0,
        pending: balance?.pendingCharges || 0,
        available: balance?.availableUsdc || 0,
      },
      deposit_instructions: {
        network: 'Base',
        token: 'USDC',
        address: newWallet.address,
        note: 'Send USDC on Base network to this address. Funds will be available immediately.',
      },
    })
  }

  const balance = await getWalletBalance(apiKey.id)

  return c.json({
    wallet: {
      address: wallet.address,
      created_at: new Date(wallet.createdAt).toISOString(),
    },
    balance: {
      usdc: balance?.balanceUsdc || 0,
      pending: balance?.pendingCharges || 0,
      available: balance?.availableUsdc || 0,
    },
    deposit_instructions: {
      network: 'Base',
      token: 'USDC',
      address: wallet.address,
      note: 'Send USDC on Base network to this address. Funds will be available immediately.',
    },
  })
})

// Create wallet (explicit creation)
// POST /v1/wallet
app.post('/', async (c) => {
  const apiKey = c.get('apiKey') as APIKeyData

  // Check if wallet already exists
  const existingWallet = await getUserWallet(apiKey.id)
  if (existingWallet) {
    return c.json({
      wallet: {
        address: existingWallet.address,
        created_at: new Date(existingWallet.createdAt).toISOString(),
      },
      message: 'Wallet already exists',
    })
  }

  const wallet = await createUserWallet(apiKey.id)

  return c.json({
    wallet: {
      address: wallet.address,
      created_at: new Date(wallet.createdAt).toISOString(),
    },
    deposit_instructions: {
      network: 'Base',
      token: 'USDC',
      address: wallet.address,
      note: 'Send USDC on Base network to this address. Funds will be available immediately.',
    },
  })
})

// Withdraw USDC
// POST /v1/wallet/withdraw
const WithdrawSchema = z.object({
  recipient_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount_usdc: z.number().positive('Amount must be positive'),
})

app.post(
  '/withdraw',
  zValidator('json', WithdrawSchema, (result, c) => {
    if (!result.success) {
      const firstError = result.error.errors[0]
      throw Errors.invalidRequest(firstError?.message || 'Invalid request', firstError?.path.join('.') || null)
    }
  }),
  async (c) => {
    const apiKey = c.get('apiKey') as APIKeyData
    const { recipient_address, amount_usdc } = c.req.valid('json')

    const result = await withdraw(apiKey.id, recipient_address, amount_usdc)

    if (!result.success) {
      if (result.error === 'wallet_not_found') {
        throw Errors.invalidRequest('No wallet found. Create a wallet first.', null)
      }
      if (result.error === 'insufficient_balance') {
        throw Errors.insufficientBalance()
      }
      throw Errors.internalError(result.error || 'Withdrawal failed')
    }

    return c.json({
      success: true,
      transaction: {
        hash: result.txHash,
        recipient: recipient_address,
        amount_usdc,
        network: 'Base',
      },
    })
  }
)

// Get transaction history
// GET /v1/wallet/history
app.get('/history', async (c) => {
  const apiKey = c.get('apiKey') as APIKeyData
  const limit = parseInt(c.req.query('limit') || '100', 10)

  const settlements = await getSettlementHistory(apiKey.id, Math.min(limit, 1000))

  return c.json({
    settlements: settlements.map((s) => ({
      request_id: s.requestId,
      amount_usdc: s.amount,
      tx_hash: s.txHash,
      timestamp: new Date(s.timestamp).toISOString(),
    })),
    count: settlements.length,
  })
})

export { app as wallet }
