import type { Context, Next } from 'hono'
import { MODELS } from '@repogen/shared'
import { Errors } from '../middleware/error-handler'
import type { APIKeyData } from '../auth/api-key'
import { reserveFunds, getWalletByAddress } from './service'

/**
 * Payment middleware - checks wallet balance and reserves funds.
 * Runs after auth middleware and budget middleware.
 *
 * With wallet-native auth, the API key is tied to a wallet address.
 * The address is stored in apiKey.walletAddress.
 */
export async function paymentMiddleware(c: Context, next: Next) {
  const apiKey = c.get('apiKey') as (APIKeyData & { walletAddress?: string }) | undefined
  const requestId = c.get('requestId') as string | undefined

  // Skip if no API key (shouldn't happen after auth middleware)
  if (!apiKey || !requestId) {
    return next()
  }

  // Get wallet address from API key
  const walletAddress = apiKey.walletAddress
  if (!walletAddress) {
    // Skip payment if no wallet (e.g., test keys)
    c.set('skipPayment', true)
    return next()
  }

  // Get request body to estimate cost
  let body: { model?: string; messages?: Array<{ content: string }> } = {}
  try {
    body = await c.req.json()
    // Store body for later use (request already consumed)
    c.set('requestBody', body)
  } catch {
    // Body might not be JSON or already consumed
    return next()
  }

  const modelId = body.model
  if (!modelId) {
    return next()
  }

  const model = MODELS[modelId]
  if (!model) {
    return next()
  }

  // Estimate input tokens from messages
  const messages = body.messages || []
  const inputText = messages.map((m) => m.content || '').join(' ')
  const estimatedInputTokens = Math.ceil(inputText.length / 4)
  const estimatedOutputTokens = 500 // Conservative estimate

  // Calculate estimated cost
  const inputCost = (estimatedInputTokens / 1_000_000) * model.input_price_per_m
  const outputCost = (estimatedOutputTokens / 1_000_000) * model.output_price_per_m
  const estimatedCostUsd = inputCost + outputCost

  // Check wallet exists
  const wallet = await getWalletByAddress(walletAddress)
  if (!wallet) {
    // Skip payment in test mode
    if (process.env.NODE_ENV === 'test') {
      c.set('skipPayment', true)
      return next()
    }
    throw Errors.invalidRequest('Wallet not found. Please authenticate with SIWE first.', null)
  }

  // Reserve funds for this request
  const result = await reserveFunds(walletAddress, estimatedCostUsd, requestId)

  if (!result.success) {
    if (result.reason === 'insufficient_balance') {
      throw Errors.insufficientBalance()
    }
    if (result.reason === 'wallet_not_found') {
      throw Errors.invalidRequest('No wallet found. Please authenticate first.', null)
    }
    throw Errors.internalError('Payment reservation failed')
  }

  // Store estimated cost for later settlement
  c.set('estimatedCostUsd', estimatedCostUsd)
  c.set('paymentReserved', true)
  c.set('walletAddress', walletAddress)

  return next()
}

/**
 * Settle payment after request completes.
 * Called from the route handler after successful response.
 */
export { settleFunds, releaseFunds } from './service'
