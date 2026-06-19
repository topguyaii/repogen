import type { ProviderId } from './types'

// Model definition
export interface ModelDefinition {
  id: string
  name: string
  providers: ProviderId[]
  context_length: number
  input_price_per_m: number // USD per million tokens
  output_price_per_m: number
  supports_streaming: boolean
  supports_tools: boolean
  privacy_tiers: ('standard' | 'no-log' | 'tee')[]
}

// Available models
export const MODELS: Record<string, ModelDefinition> = {
  'llama-3.3-70b': {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    providers: ['together', 'fireworks', 'groq'],
    context_length: 128000,
    input_price_per_m: 0.59,
    output_price_per_m: 0.79,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },
  'llama-3.1-8b': {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    providers: ['together', 'fireworks', 'groq'],
    context_length: 128000,
    input_price_per_m: 0.10,
    output_price_per_m: 0.10,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },
  'qwen-2.5-72b': {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    providers: ['together', 'fireworks'],
    context_length: 32768,
    input_price_per_m: 0.90,
    output_price_per_m: 0.90,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },
  'deepseek-v3': {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    providers: ['together', 'fireworks'],
    context_length: 64000,
    input_price_per_m: 0.14,
    output_price_per_m: 0.28,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    providers: ['openai'],
    context_length: 128000,
    input_price_per_m: 2.50,
    output_price_per_m: 10.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },
  'claude-sonnet-4': {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    providers: ['anthropic'],
    context_length: 200000,
    input_price_per_m: 3.00,
    output_price_per_m: 15.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },
}

// Get model by ID
export function getModel(id: string): ModelDefinition | undefined {
  return MODELS[id]
}

// Get all models
export function getAllModels(): ModelDefinition[] {
  return Object.values(MODELS)
}
