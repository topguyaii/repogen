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

// Available models - Best in class for open and closed
export const MODELS: Record<string, ModelDefinition> = {
  // ===================
  // OPEN MODELS
  // ===================

  // #1 Open Model - GLM 5.2
  'glm-5.2': {
    id: 'glm-5.2',
    name: 'GLM 5.2',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.60,
    output_price_per_m: 0.60,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // DeepSeek V3 - Best value, incredible performance
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

  // Llama 3.3 70B - Meta's latest
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

  // Llama 3.1 405B - Largest open model
  'llama-3.1-405b': {
    id: 'llama-3.1-405b',
    name: 'Llama 3.1 405B',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 3.00,
    output_price_per_m: 3.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // Qwen 2.5 72B - Alibaba's best
  'qwen-2.5-72b': {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.90,
    output_price_per_m: 0.90,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // Qwen 2.5 Coder 32B - Best open coding model
  'qwen-2.5-coder-32b': {
    id: 'qwen-2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.80,
    output_price_per_m: 0.80,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // Mixtral 8x22B - MoE architecture
  'mixtral-8x22b': {
    id: 'mixtral-8x22b',
    name: 'Mixtral 8x22B',
    providers: ['together', 'fireworks'],
    context_length: 65536,
    input_price_per_m: 0.65,
    output_price_per_m: 0.65,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // DeepSeek R1 - Reasoning model
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    providers: ['together', 'fireworks'],
    context_length: 64000,
    input_price_per_m: 0.55,
    output_price_per_m: 2.19,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // Llama 3.1 8B - Fast and cheap
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

  // Gemma 2 27B - Google's open model
  'gemma-2-27b': {
    id: 'gemma-2-27b',
    name: 'Gemma 2 27B',
    providers: ['together', 'fireworks'],
    context_length: 8192,
    input_price_per_m: 0.27,
    output_price_per_m: 0.27,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // ===================
  // CLOSED MODELS
  // ===================

  // OpenAI GPT-4o - Flagship
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

  // OpenAI GPT-4o Mini - Fast and affordable
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    providers: ['openai'],
    context_length: 128000,
    input_price_per_m: 0.15,
    output_price_per_m: 0.60,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // OpenAI o1 - Reasoning model
  'o1': {
    id: 'o1',
    name: 'OpenAI o1',
    providers: ['openai'],
    context_length: 200000,
    input_price_per_m: 15.00,
    output_price_per_m: 60.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // OpenAI o3-mini - Fast reasoning
  'o3-mini': {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    providers: ['openai'],
    context_length: 200000,
    input_price_per_m: 1.10,
    output_price_per_m: 4.40,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // Claude Opus 4 - Most capable
  'claude-opus-4': {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    providers: ['anthropic'],
    context_length: 200000,
    input_price_per_m: 15.00,
    output_price_per_m: 75.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // Claude Sonnet 4 - Best balance
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

  // Claude Haiku 3.5 - Fast and cheap
  'claude-haiku-3.5': {
    id: 'claude-haiku-3.5',
    name: 'Claude Haiku 3.5',
    providers: ['anthropic'],
    context_length: 200000,
    input_price_per_m: 0.80,
    output_price_per_m: 4.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // Gemini 1.5 Pro - Google's best
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    providers: ['google'],
    context_length: 2000000,
    input_price_per_m: 1.25,
    output_price_per_m: 5.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // Gemini 1.5 Flash - Fast
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    providers: ['google'],
    context_length: 1000000,
    input_price_per_m: 0.075,
    output_price_per_m: 0.30,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // Gemini 2.0 Flash - Latest
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    providers: ['google'],
    context_length: 1000000,
    input_price_per_m: 0.10,
    output_price_per_m: 0.40,
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

// Get open models only
export function getOpenModels(): ModelDefinition[] {
  return Object.values(MODELS).filter((m) =>
    m.privacy_tiers.includes('no-log')
  )
}

// Get closed models only
export function getClosedModels(): ModelDefinition[] {
  return Object.values(MODELS).filter(
    (m) => !m.privacy_tiers.includes('no-log')
  )
}
