import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { MODELS, type ChatCompletionResponse, type ProviderId } from '@repogen/shared'
import { Errors } from '../middleware/error-handler'
import { generateCompletionId, createSSEStream, sseData, sseDone, createChunk, createInitialChunk } from '../lib/stream'
import { selectProvider, executeWithFailover, executeStreamWithFailover } from '../router'
import type { RoutingContext } from '../adapters/types'

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

// Check if we're in test mode (no real API keys)
function isTestMode(): boolean {
  return !process.env.TOGETHER_API_KEY &&
         !process.env.FIREWORKS_API_KEY &&
         !process.env.OPENAI_API_KEY
}

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

    // Build routing context
    const routingContext: RoutingContext = {
      modelId: request.model,
      strategy: request.routing || 'cheapest',
      preferredProvider: request.preferred_provider,
      privacyTier: request.privacy_tier || 'standard',
    }

    // Use mock provider in test mode
    if (isTestMode()) {
      const { generateMockResponse, generateMockStream } = await import('../lib/mock-provider')

      if (request.stream) {
        const contentStream = generateMockStream(request)
        const sseStream = createSSEStream(completionId, request.model, contentStream)
        return new Response(sseStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }

      const { content, promptTokens, completionTokens } = await generateMockResponse(request)
      const response: ChatCompletionResponse = {
        id: completionId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [{
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        },
        repogen: {
          provider: 'together',
          privacy_tier: request.privacy_tier || 'standard',
          cost_usd: 0,
        },
      }
      return c.json(response)
    }

    // Handle streaming response
    if (request.stream) {
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial chunk with role
            const initialChunk = createInitialChunk(completionId, request.model)
            controller.enqueue(encoder.encode(sseData(JSON.stringify(initialChunk))))

            let providerId: ProviderId = 'together'

            // Stream from provider with failover
            const streamGenerator = executeStreamWithFailover(
              routingContext,
              (provider) => provider.stream(request)
            )

            for await (const chunk of streamGenerator) {
              providerId = chunk.providerId

              if (chunk.content) {
                const sseChunk = createChunk(completionId, request.model, chunk.content)
                controller.enqueue(encoder.encode(sseData(JSON.stringify(sseChunk))))
              }

              if (chunk.finishReason) {
                const finalChunk = createChunk(completionId, request.model, '', chunk.finishReason)
                controller.enqueue(encoder.encode(sseData(JSON.stringify(finalChunk))))
              }
            }

            controller.enqueue(encoder.encode(sseDone()))
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // Handle non-streaming response with failover
    const { response: adapterResponse, providerId } = await executeWithFailover(
      routingContext,
      (provider) => provider.complete(request)
    )

    // Calculate cost
    const inputCost = (adapterResponse.promptTokens / 1_000_000) * model.input_price_per_m
    const outputCost = (adapterResponse.completionTokens / 1_000_000) * model.output_price_per_m
    const totalCost = inputCost + outputCost

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
            content: adapterResponse.content,
          },
          finish_reason: adapterResponse.finishReason,
        },
      ],
      usage: {
        prompt_tokens: adapterResponse.promptTokens,
        completion_tokens: adapterResponse.completionTokens,
        total_tokens: adapterResponse.promptTokens + adapterResponse.completionTokens,
      },
      repogen: {
        provider: providerId,
        privacy_tier: request.privacy_tier || 'standard',
        cost_usd: totalCost,
      },
    }

    // Add provider latency header
    c.header('X-Repogen-Provider', providerId)
    c.header('X-Repogen-Latency', String(adapterResponse.providerLatencyMs))

    return c.json(response)
  }
)

export { app as chatCompletions }
