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
    // Open models
    'kimi-k2.7': 'moonshot-ai/Kimi-K2.7',
    'deepseek-v4-pro': 'deepseek-ai/DeepSeek-V4-Pro',
    'glm-5.2': 'THUDM/GLM-5.2-32B-Instruct',
    'llama-4-maverick': 'meta-llama/Llama-4-Maverick',
    'llama-4-scout': 'meta-llama/Llama-4-Scout',
    'llama-4-scout-mini': 'meta-llama/Llama-4-Scout-Mini',
    'qwen-3.5-72b': 'Qwen/Qwen3.5-72B-Instruct',
    'qwen-3.5-coder-32b': 'Qwen/Qwen3.5-Coder-32B-Instruct',
    'minimax-m3': 'MiniMax/MiniMax-M3',
    'deepseek-r1': 'deepseek-ai/DeepSeek-R1',
    'gemma-4-31b': 'google/gemma-4-31b-it',
    'mistral-small-4': 'mistralai/Mistral-Small-4',
  },
  fireworks: {
    // Open models
    'kimi-k2.7': 'accounts/fireworks/models/kimi-k2-7',
    'deepseek-v4-pro': 'accounts/fireworks/models/deepseek-v4-pro',
    'glm-5.2': 'accounts/fireworks/models/glm-5-2-32b-instruct',
    'llama-4-maverick': 'accounts/fireworks/models/llama-4-maverick',
    'llama-4-scout': 'accounts/fireworks/models/llama-4-scout',
    'llama-4-scout-mini': 'accounts/fireworks/models/llama-4-scout-mini',
    'qwen-3.5-72b': 'accounts/fireworks/models/qwen3p5-72b-instruct',
    'qwen-3.5-coder-32b': 'accounts/fireworks/models/qwen3p5-coder-32b-instruct',
    'minimax-m3': 'accounts/fireworks/models/minimax-m3',
    'deepseek-r1': 'accounts/fireworks/models/deepseek-r1',
    'gemma-4-31b': 'accounts/fireworks/models/gemma-4-31b-it',
    'mistral-small-4': 'accounts/fireworks/models/mistral-small-4',
  },
  groq: {
    'llama-4-maverick': 'llama-4-maverick',
    'llama-4-scout-mini': 'llama-4-scout-mini',
  },
  openai: {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-5.5': 'gpt-5.5',
    'o1': 'o1',
    'o3-mini': 'o3-mini',
  },
  anthropic: {
    'claude-opus-4': 'claude-opus-4-20250514',
    'claude-sonnet-4': 'claude-sonnet-4-20250514',
    'claude-haiku-3.5': 'claude-3-5-haiku-20241022',
  },
  google: {
    'gemini-2.0-pro': 'gemini-2.0-pro',
    'gemini-2.0-flash': 'gemini-2.0-flash',
  },
  phala: {
    'llama-4-maverick': 'llama-4-maverick',
    'deepseek-v4-pro': 'deepseek-v4-pro',
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
