import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ChatCompletionRequest, MODELS, type ChatCompletionResponse } from '@repogen/shared'
import { Errors } from '../middleware/error-handler'
import { generateCompletionId, createSSEStream } from '../lib/stream'
import { generateMockResponse, generateMockStream, countTokens } from '../lib/mock-provider'

const app = new Hono()

// Extended request schema with all OpenAI parameters
const ChatRequestSchema = z.object({
  model: z.string().min(1, 'model is required'),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1, 'messages must contain at least one message'),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().positive().optional(),
  stream: z.boolean().optional().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  user: z.string().optional(),
  // repogen extensions
  privacy_tier: z.enum(['standard', 'no-log', 'tee']).optional().default('standard'),
  routing: z.enum(['cheapest', 'fastest', 'specific']).optional().default('cheapest'),
  preferred_provider: z.enum(['together', 'fireworks', 'groq', 'openai', 'anthropic', 'google', 'phala']).optional(),
})

// POST /v1/chat/completions
app.post(
  '/completions',
  zValidator('json', ChatRequestSchema, (result, c) => {
    if (!result.success) {
      const firstError = result.error.errors[0]
      const param = firstError?.path.join('.') || null
      const message = firstError?.message || 'Invalid request'
      throw Errors.invalidRequest(message, param)
    }
  }),
  async (c) => {
    const request = c.req.valid('json')

    // Validate model exists
    const model = MODELS[request.model]
    if (!model) {
      throw Errors.invalidRequest(
        `The model '${request.model}' does not exist or you do not have access to it.`,
        'model'
      )
    }

    // Validate privacy tier is supported by model
    if (request.privacy_tier && !model.privacy_tiers.includes(request.privacy_tier)) {
      throw Errors.invalidRequest(
        `The model '${request.model}' does not support privacy tier '${request.privacy_tier}'`,
        'privacy_tier'
      )
    }

    const completionId = generateCompletionId()

    // Handle streaming response
    if (request.stream) {
      const contentStream = generateMockStream(request)
      const sseStream = createSSEStream(completionId, request.model, contentStream)

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // Handle non-streaming response
    const { content, promptTokens, completionTokens } = await generateMockResponse(request)

    const response: ChatCompletionResponse = {
      id: completionId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      // repogen extensions
      repogen: {
        provider: 'together', // Mock provider for Phase 1
        privacy_tier: request.privacy_tier || 'standard',
        cost_usd: 0, // Will be calculated in Phase 3
      },
    }

    return c.json(response)
  }
)

export { app as chatCompletions }
