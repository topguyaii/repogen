import type { ProviderId } from './types'

// Provider configuration
export interface ProviderConfig {
  id: ProviderId
  name: string
  base_url: string
  supports_no_log: boolean
  supports_tee: boolean
  healthy: boolean
}

// Provider configs
export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  together: {
    id: 'together',
    name: 'Together.ai',
    base_url: 'https://api.together.xyz/v1',
    supports_no_log: true,
    supports_tee: false,
    healthy: true,
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks.ai',
    base_url: 'https://api.fireworks.ai/inference/v1',
    supports_no_log: true,
    supports_tee: false,
    healthy: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    base_url: 'https://api.groq.com/openai/v1',
    supports_no_log: false,
    supports_tee: false,
    healthy: true,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    base_url: 'https://api.openai.com/v1',
    supports_no_log: false,
    supports_tee: false,
    healthy: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    base_url: 'https://api.anthropic.com/v1',
    supports_no_log: false,
    supports_tee: false,
    healthy: true,
  },
  phala: {
    id: 'phala',
    name: 'Phala Network',
    base_url: 'https://api.phala.network/v1',
    supports_no_log: true,
    supports_tee: true,
    healthy: true,
  },
}

// Model ID mappings per provider
export const MODEL_MAPPINGS: Record<ProviderId, Record<string, string>> = {
  together: {
    'llama-3.3-70b': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    'qwen-2.5-72b': 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    'deepseek-v3': 'deepseek-ai/DeepSeek-V3',
  },
  fireworks: {
    'llama-3.3-70b': 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    'llama-3.1-8b': 'accounts/fireworks/models/llama-v3p1-8b-instruct',
    'qwen-2.5-72b': 'accounts/fireworks/models/qwen2p5-72b-instruct',
    'deepseek-v3': 'accounts/fireworks/models/deepseek-v3',
  },
  groq: {
    'llama-3.3-70b': 'llama-3.3-70b-versatile',
    'llama-3.1-8b': 'llama-3.1-8b-instant',
  },
  openai: {
    'gpt-4o': 'gpt-4o',
  },
  anthropic: {
    'claude-sonnet-4': 'claude-sonnet-4-20250514',
  },
  phala: {
    'llama-3.3-70b': 'llama-3.3-70b',
  },
}

// Get provider's model ID from repogen model ID
export function getProviderModelId(provider: ProviderId, modelId: string): string | undefined {
  return MODEL_MAPPINGS[provider]?.[modelId]
}
