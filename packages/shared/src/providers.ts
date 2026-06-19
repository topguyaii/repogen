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
  google: {
    id: 'google',
    name: 'Google AI',
    base_url: 'https://generativelanguage.googleapis.com/v1beta',
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

// Model ID mappings per provider (repogen ID -> provider's ID)
export const MODEL_MAPPINGS: Record<ProviderId, Record<string, string>> = {
  together: {
    'glm-5.2': 'THUDM/GLM-5-32B-Instruct',
    'deepseek-v3': 'deepseek-ai/DeepSeek-V3',
    'deepseek-r1': 'deepseek-ai/DeepSeek-R1',
    'llama-3.3-70b': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'llama-3.1-405b': 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    'qwen-2.5-72b': 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    'qwen-2.5-coder-32b': 'Qwen/Qwen2.5-Coder-32B-Instruct',
    'mixtral-8x22b': 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    'gemma-2-27b': 'google/gemma-2-27b-it',
  },
  fireworks: {
    'glm-5.2': 'accounts/fireworks/models/glm-5-32b-instruct',
    'deepseek-v3': 'accounts/fireworks/models/deepseek-v3',
    'deepseek-r1': 'accounts/fireworks/models/deepseek-r1',
    'llama-3.3-70b': 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    'llama-3.1-405b': 'accounts/fireworks/models/llama-v3p1-405b-instruct',
    'llama-3.1-8b': 'accounts/fireworks/models/llama-v3p1-8b-instruct',
    'qwen-2.5-72b': 'accounts/fireworks/models/qwen2p5-72b-instruct',
    'qwen-2.5-coder-32b': 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
    'mixtral-8x22b': 'accounts/fireworks/models/mixtral-8x22b-instruct',
    'gemma-2-27b': 'accounts/fireworks/models/gemma2-27b-it',
  },
  groq: {
    'llama-3.3-70b': 'llama-3.3-70b-versatile',
    'llama-3.1-8b': 'llama-3.1-8b-instant',
    'mixtral-8x22b': 'mixtral-8x7b-32768',
    'gemma-2-27b': 'gemma2-9b-it',
  },
  openai: {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o1': 'o1',
    'o3-mini': 'o3-mini',
  },
  anthropic: {
    'claude-opus-4': 'claude-opus-4-20250514',
    'claude-sonnet-4': 'claude-sonnet-4-20250514',
    'claude-haiku-3.5': 'claude-3-5-haiku-20241022',
  },
  google: {
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash-exp',
  },
  phala: {
    'llama-3.3-70b': 'llama-3.3-70b',
    'deepseek-v3': 'deepseek-v3',
  },
}

// Get provider's model ID from repogen model ID
export function getProviderModelId(provider: ProviderId, modelId: string): string | undefined {
  return MODEL_MAPPINGS[provider]?.[modelId]
}

// Get all providers that support a model
export function getProvidersForModel(modelId: string): ProviderId[] {
  return (Object.keys(MODEL_MAPPINGS) as ProviderId[]).filter(
    (provider) => MODEL_MAPPINGS[provider][modelId] !== undefined
  )
}
