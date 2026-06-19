import type { Context, Next } from 'hono'
import { MODELS } from '@repogen/shared'
import { checkAndReserveBudget, finalizeBudget, releaseBudget } from './service'
import { Errors } from '../middleware/error-handler'

// Extend context to include budget data
declare module 'hono' {
  interface ContextVariableMap {
    budgetReservation: {
      reserved: boolean
      reservedAmount: number
      requestId: string
    }
  }
}

// Default token estimate for budget reservation
const DEFAULT_INPUT_TOKENS = 500
const DEFAULT_OUTPUT_TOKENS = 500

/**
 * Budget middleware - checks and reserves budget before processing.
 * Must be used AFTER authMiddleware.
 */
export async function budgetMiddleware(c: Context, next: Next): Promise<Response | void> {
  const apiKey = c.get('apiKey')
  const requestId = c.get('requestId')

  // Skip if no API key (shouldn't happen after auth middleware)
  if (!apiKey) {
    return next()
  }

  // Get model from request body to estimate cost
  let estimatedCost = 0.01 // Default minimum estimate

  try {
    const body = await c.req.json()
    const modelId = body.model

    if (modelId && MODELS[modelId]) {
      const model = MODELS[modelId]

      // Estimate tokens (use max_tokens if provided, otherwise defaults)
      const inputTokens = DEFAULT_INPUT_TOKENS
      const outputTokens = body.max_tokens || DEFAULT_OUTPUT_TOKENS

      // Calculate estimated cost
      const inputCost = (inputTokens / 1_000_000) * model.input_price_per_m
      const outputCost = (outputTokens / 1_000_000) * model.output_price_per_m
      estimatedCost = inputCost + outputCost

      // Add 20% buffer for safety
      estimatedCost *= 1.2
    }
  } catch {
    // If we can't parse body, use default estimate
  }

  // Check and reserve budget atomically
  const result = await checkAndReserveBudget(apiKey, estimatedCost, requestId)

  if (!result.allowed) {
    // Budget exceeded - return error immediately
    if (result.reason === 'daily_limit_exceeded') {
      throw Errors.insufficientQuota(
        `Daily budget limit exceeded. Spent: $${result.dailySpent.toFixed(4)}, Limit: $${result.dailyLimit.toFixed(2)}`
      )
    }
    if (result.reason === 'total_limit_exceeded') {
      throw Errors.insufficientQuota(
        `Total budget limit exceeded. Spent: $${result.totalSpent.toFixed(4)}, Limit: $${result.totalLimit.toFixed(2)}`
      )
    }
    throw Errors.insufficientQuota('Budget limit exceeded')
  }

  // Store reservation info in context for later finalization
  c.set('budgetReservation', {
    reserved: true,
    reservedAmount: estimatedCost,
    requestId,
  })

  // Add budget info to response headers
  c.header('X-Budget-Daily-Remaining', (result.dailyLimit - result.dailySpent).toFixed(4))
  c.header('X-Budget-Total-Remaining', result.totalLimit > 0
    ? (result.totalLimit - result.totalSpent).toFixed(4)
    : 'unlimited')

  return next()
}

/**
 * Finalize budget after successful response.
 * Call this with the actual cost after processing completes.
 */
export async function finalizeBudgetForRequest(
  c: Context,
  actualCostUsd: number
): Promise<void> {
  const apiKey = c.get('apiKey')
  const reservation = c.get('budgetReservation')

  if (!apiKey || !reservation?.reserved) {
    return
  }

  await finalizeBudget(apiKey, reservation.requestId, actualCostUsd)
}

/**
 * Release budget reservation (e.g., on error).
 */
export async function releaseBudgetForRequest(c: Context): Promise<void> {
  const apiKey = c.get('apiKey')
  const reservation = c.get('budgetReservation')

  if (!apiKey || !reservation?.reserved) {
    return
  }

  await releaseBudget(apiKey, reservation.requestId)
}
