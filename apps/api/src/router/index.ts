import type { ProviderId } from '@repogen/shared'
import { MODELS, PROVIDERS, getProviderModelId } from '@repogen/shared'
import { getAdapter, getAdaptersForModel } from '../adapters'
import type { ProviderAdapter, RoutingContext, RoutingResult, AdapterResponse, AdapterStreamChunk } from '../adapters/types'
import { isProviderAvailable, recordSuccess, recordFailure } from './circuit-breaker'
import { Errors } from '../middleware/error-handler'

// Estimated latency rankings (lower is better)
const LATENCY_RANKINGS: Record<ProviderId, number> = {
  groq: 1, // Fastest
  fireworks: 2,
  together: 3,
  openai: 4,
  anthropic: 5,
  google: 6,
  phala: 7, // TEE has overhead
}

// Select the best provider for a request
export function selectProvider(context: RoutingContext): RoutingResult {
  const model = MODELS[context.modelId]
  if (!model) {
    throw Errors.invalidRequest(`Unknown model: ${context.modelId}`, 'model')
  }

  // Get all adapters that support this model
  let candidates = getAdaptersForModel(context.modelId)

  // Filter by privacy tier
  if (context.privacyTier === 'no-log') {
    candidates = candidates.filter((adapter) => {
      const provider = PROVIDERS[adapter.id]
      return provider?.supports_no_log
    })
  } else if (context.privacyTier === 'tee') {
    candidates = candidates.filter((adapter) => {
      const provider = PROVIDERS[adapter.id]
      return provider?.supports_tee
    })
  }

  // Filter out excluded providers
  if (context.excludeProviders?.length) {
    candidates = candidates.filter(
      (adapter) => !context.excludeProviders!.includes(adapter.id)
    )
  }

  // Filter by circuit breaker
  candidates = candidates.filter((adapter) => isProviderAvailable(adapter.id))

  if (candidates.length === 0) {
    throw Errors.server('No available providers for this model and privacy tier')
  }

  // If specific provider requested, try to use it
  if (context.strategy === 'specific' && context.preferredProvider) {
    const preferred = candidates.find((a) => a.id === context.preferredProvider)
    if (preferred) {
      return buildRoutingResult(preferred, context.modelId, model)
    }
    // Fall through to other strategies if preferred not available
  }

  // Sort by strategy
  if (context.strategy === 'fastest') {
    candidates.sort((a, b) => {
      const rankA = LATENCY_RANKINGS[a.id] ?? 99
      const rankB = LATENCY_RANKINGS[b.id] ?? 99
      return rankA - rankB
    })
  } else {
    // Default: cheapest
    candidates.sort((a, b) => {
      const costA = model.input_price_per_m + model.output_price_per_m
      const costB = model.input_price_per_m + model.output_price_per_m
      return costA - costB
    })
  }

  return buildRoutingResult(candidates[0], context.modelId, model)
}

function buildRoutingResult(
  adapter: ProviderAdapter,
  modelId: string,
  model: (typeof MODELS)[string]
): RoutingResult {
  const providerModelId = getProviderModelId(adapter.id, modelId)
  if (!providerModelId) {
    throw Errors.server(`Model mapping not found for ${modelId} on ${adapter.id}`)
  }

  return {
    provider: adapter,
    providerId: adapter.id,
    providerModelId,
    estimatedCostPer1M: {
      input: model.input_price_per_m,
      output: model.output_price_per_m,
    },
  }
}

// Execute request with automatic failover
export async function executeWithFailover(
  context: RoutingContext,
  execute: (provider: ProviderAdapter) => Promise<AdapterResponse>
): Promise<{ response: AdapterResponse; providerId: ProviderId }> {
  const maxRetries = 3
  const triedProviders: ProviderId[] = []

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const routing = selectProvider({
      ...context,
      excludeProviders: triedProviders,
    })

    triedProviders.push(routing.providerId)

    try {
      const response = await execute(routing.provider)
      recordSuccess(routing.providerId)
      return { response, providerId: routing.providerId }
    } catch (error) {
      recordFailure(routing.providerId)
      console.error(`Provider ${routing.providerId} failed:`, error)

      // If this was the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Otherwise, try next provider
    }
  }

  throw Errors.server('All providers failed')
}

// Execute streaming request with failover
export async function* executeStreamWithFailover(
  context: RoutingContext,
  execute: (provider: ProviderAdapter) => AsyncGenerator<AdapterStreamChunk>
): AsyncGenerator<AdapterStreamChunk & { providerId: ProviderId }> {
  const maxRetries = 3
  const triedProviders: ProviderId[] = []

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const routing = selectProvider({
      ...context,
      excludeProviders: triedProviders,
    })

    triedProviders.push(routing.providerId)

    try {
      const stream = execute(routing.provider)
      let hasYielded = false

      for await (const chunk of stream) {
        hasYielded = true
        yield { ...chunk, providerId: routing.providerId }
      }

      // If we got here, stream completed successfully
      recordSuccess(routing.providerId)
      return
    } catch (error) {
      recordFailure(routing.providerId)
      console.error(`Provider ${routing.providerId} stream failed:`, error)

      // If this was the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Otherwise, try next provider
    }
  }

  throw Errors.server('All providers failed')
}

export * from './circuit-breaker'
