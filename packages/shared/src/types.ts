import { z } from 'zod'

// Privacy tiers
export const PrivacyTier = z.enum(['standard', 'no-log', 'tee'])
export type PrivacyTier = z.infer<typeof PrivacyTier>

// Routing strategy
export const RoutingStrategy = z.enum(['cheapest', 'fastest', 'specific'])
export type RoutingStrategy = z.infer<typeof RoutingStrategy>

// Provider IDs
export const ProviderId = z.enum(['together', 'fireworks', 'groq', 'openai', 'anthropic', 'google', 'phala'])
export type ProviderId = z.infer<typeof ProviderId>

// OpenAI-compatible message format
export const ChatMessage = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessage>

// Chat completion request
export const ChatCompletionRequest = z.object({
  model: z.string(),
  messages: z.array(ChatMessage),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  stream: z.boolean().optional().default(false),
  // repogen extensions
  privacy_tier: PrivacyTier.optional().default('standard'),
  routing: RoutingStrategy.optional().default('cheapest'),
  preferred_provider: ProviderId.optional(),
})
export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequest>

// Chat completion response
export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: 'stop' | 'length' | 'content_filter' | null
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  // repogen extensions
  repogen?: {
    provider: ProviderId
    privacy_tier: PrivacyTier
    cost_usd: number
  }
}

// Streaming chunk
export interface ChatCompletionChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: {
    index: number
    delta: Partial<ChatMessage>
    finish_reason: 'stop' | 'length' | 'content_filter' | null
  }[]
}

// Budget types
export interface Budget {
  id: string
  api_key_id: string
  daily_limit_usd: number
  task_limit_usd: number | null
  total_limit_usd: number | null
  spent_today_usd: number
  spent_total_usd: number
  reset_at: Date
}

// x402 payment types
export interface X402PaymentHeader {
  authorization: string // USDC amount authorized
  ceiling: string // Max amount allowed
  payer: string // Wallet address
  signature: string // Payment signature
}
