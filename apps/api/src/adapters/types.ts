import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ProviderId,
} from '@repogen/shared'

// Provider adapter interface
export interface ProviderAdapter {
  readonly id: ProviderId
  readonly name: string

  // Check if provider supports a model
  supportsModel(modelId: string): boolean

  // Generate completion (non-streaming)
  complete(request: ChatCompletionRequest): Promise<AdapterResponse>

  // Generate completion (streaming)
  stream(request: ChatCompletionRequest): AsyncGenerator<AdapterStreamChunk>

  // Health check
  healthCheck(): Promise<boolean>
}

// Response from adapter
export interface AdapterResponse {
  content: string
  promptTokens: number
  completionTokens: number
  finishReason: 'stop' | 'length' | 'content_filter'
  providerLatencyMs: number
}

// Streaming chunk from adapter
export interface AdapterStreamChunk {
  content: string
  finishReason?: 'stop' | 'length' | 'content_filter'
}

// Provider health status
export interface ProviderHealth {
  providerId: ProviderId
  healthy: boolean
  lastCheck: Date
  consecutiveFailures: number
  avgLatencyMs: number
  errorRate: number
}

// Circuit breaker state
export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerState {
  state: CircuitState
  failures: number
  lastFailure: Date | null
  nextRetry: Date | null
}

// Routing context passed to router
export interface RoutingContext {
  modelId: string
  strategy: 'cheapest' | 'fastest' | 'specific'
  preferredProvider?: ProviderId
  privacyTier: 'standard' | 'no-log' | 'tee'
  excludeProviders?: ProviderId[]
}

// Result from router selection
export interface RoutingResult {
  provider: ProviderAdapter
  providerId: ProviderId
  providerModelId: string
  estimatedCostPer1M: { input: number; output: number }
}
