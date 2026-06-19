import type { ProviderId } from '@repogen/shared'
import type { ProviderAdapter } from './types'
import { OpenAICompatibleAdapter } from './openai-compatible'
import { AnthropicAdapter } from './anthropic'

// Create all provider adapters
const adapters: Map<ProviderId, ProviderAdapter> = new Map()

// Together.ai - OpenAI compatible
adapters.set(
  'together',
  new OpenAICompatibleAdapter({
    id: 'together',
    name: 'Together.ai',
    baseUrl: 'https://api.together.xyz/v1',
    apiKeyEnvVar: 'TOGETHER_API_KEY',
  })
)

// Fireworks.ai - OpenAI compatible
adapters.set(
  'fireworks',
  new OpenAICompatibleAdapter({
    id: 'fireworks',
    name: 'Fireworks.ai',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    apiKeyEnvVar: 'FIREWORKS_API_KEY',
  })
)

// Groq - OpenAI compatible
adapters.set(
  'groq',
  new OpenAICompatibleAdapter({
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnvVar: 'GROQ_API_KEY',
  })
)

// OpenAI
adapters.set(
  'openai',
  new OpenAICompatibleAdapter({
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnvVar: 'OPENAI_API_KEY',
  })
)

// Anthropic - Custom format
adapters.set('anthropic', new AnthropicAdapter())

// Phala Network - OpenAI compatible (TEE provider)
adapters.set(
  'phala',
  new OpenAICompatibleAdapter({
    id: 'phala',
    name: 'Phala Network',
    baseUrl: 'https://api.phala.network/v1',
    apiKeyEnvVar: 'PHALA_API_KEY',
  })
)

// Export functions to access adapters
export function getAdapter(providerId: ProviderId): ProviderAdapter | undefined {
  return adapters.get(providerId)
}

export function getAllAdapters(): ProviderAdapter[] {
  return Array.from(adapters.values())
}

export function getAdaptersForModel(modelId: string): ProviderAdapter[] {
  return getAllAdapters().filter((adapter) => adapter.supportsModel(modelId))
}

export { adapters }
export * from './types'
