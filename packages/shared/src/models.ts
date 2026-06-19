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

// Available models - Best in class for open and closed (June 2026)
export const MODELS: Record<string, ModelDefinition> = {
  // ===================
  // OPEN MODELS (Top 12)
  // ===================

  // #1 - Kimi K2.7 - Moonshot AI's flagship (1T params, 32B active)
  // 80.2% SWE-Bench, best for coding/agentic tasks
  'kimi-k2.7': {
    id: 'kimi-k2.7',
    name: 'Kimi K2.7',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.95,
    output_price_per_m: 4.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #2 - DeepSeek V4 Pro - Leading open weights on coding
  // 80.6% SWE-Bench Verified
  'deepseek-v4-pro': {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.40,
    output_price_per_m: 1.60,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #3 - GLM-5.2 - Strongest coding-oriented open source
  // 94.2 HumanEval, 95.7 AIME 2025
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

  // #4 - Llama 4 Maverick - Meta's best (17B active / 400B total)
  // Beats GPT-4o on coding, reasoning, multilingual
  'llama-4-maverick': {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    providers: ['together', 'fireworks', 'groq'],
    context_length: 1000000,
    input_price_per_m: 0.70,
    output_price_per_m: 0.90,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #5 - Llama 4 Scout - 10M context window
  'llama-4-scout': {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    providers: ['together', 'fireworks'],
    context_length: 10000000,
    input_price_per_m: 0.25,
    output_price_per_m: 0.35,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #6 - Qwen 3.5 - Best-in-class graduate-level reasoning
  'qwen-3.5-72b': {
    id: 'qwen-3.5-72b',
    name: 'Qwen 3.5 72B',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.90,
    output_price_per_m: 0.90,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #7 - MiniMax M3 - Strong coding (80.5% SWE-Bench)
  'minimax-m3': {
    id: 'minimax-m3',
    name: 'MiniMax M3',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.50,
    output_price_per_m: 1.50,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #8 - DeepSeek R1 - Reasoning specialist
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

  // #9 - Qwen 3.5 Coder - Coding specialist
  'qwen-3.5-coder-32b': {
    id: 'qwen-3.5-coder-32b',
    name: 'Qwen 3.5 Coder 32B',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.80,
    output_price_per_m: 0.80,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #10 - Gemma 4 31B - Google's open model
  'gemma-4-31b': {
    id: 'gemma-4-31b',
    name: 'Gemma 4 31B',
    providers: ['together', 'fireworks'],
    context_length: 128000,
    input_price_per_m: 0.30,
    output_price_per_m: 0.30,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #11 - Mistral Small 4 - Production-ready
  'mistral-small-4': {
    id: 'mistral-small-4',
    name: 'Mistral Small 4',
    providers: ['together', 'fireworks'],
    context_length: 32768,
    input_price_per_m: 0.20,
    output_price_per_m: 0.60,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // #12 - Llama 4 Scout Mini - Fast and cheap
  'llama-4-scout-mini': {
    id: 'llama-4-scout-mini',
    name: 'Llama 4 Scout Mini',
    providers: ['together', 'fireworks', 'groq'],
    context_length: 128000,
    input_price_per_m: 0.08,
    output_price_per_m: 0.08,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard', 'no-log'],
  },

  // ===================
  // CLOSED MODELS (Top 10)
  // ===================

  // GPT-4o - OpenAI flagship
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

  // GPT-4o Mini - Fast and affordable
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

  // GPT-5.5 - Latest OpenAI
  'gpt-5.5': {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    providers: ['openai'],
    context_length: 200000,
    input_price_per_m: 5.00,
    output_price_per_m: 15.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // o1 - OpenAI reasoning
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

  // o3-mini - Fast reasoning
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

  // Claude Opus 4 - Most capable Anthropic
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

  // Gemini 2.0 Pro - Google's best
  'gemini-2.0-pro': {
    id: 'gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    providers: ['google'],
    context_length: 2000000,
    input_price_per_m: 1.25,
    output_price_per_m: 5.00,
    supports_streaming: true,
    supports_tools: true,
    privacy_tiers: ['standard'],
  },

  // Gemini 2.0 Flash - Fast
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

// Get open models only (support no-log tier)
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
