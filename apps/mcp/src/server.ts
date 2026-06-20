import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MODELS } from '@repogen/shared'

// Response types for our API
interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  repogen?: {
    cost_usd: number
    provider: string
    privacy_tier: string
  }
}

interface WalletResponse {
  wallet: {
    address: string
  }
  balance: {
    usdc: number
    pending: number
    available: number
  }
}

interface ErrorResponse {
  error?: {
    message: string
  }
}

/**
 * Create and configure the repogen MCP server.
 * Exposes inference capabilities as MCP tools.
 */
export function createMcpServer() {
  const server = new McpServer(
    {
      name: 'repogen',
      version: '0.1.0',
    },
    {
      instructions: `repogen is a private inference layer for AI agents.

Available tools:
- chat: Send messages to any supported LLM model
- list_models: List all available models with pricing
- get_balance: Check your wallet balance

All requests are paid per-call in USDC. Ensure your wallet is funded before making requests.`,
    }
  )

  // Register the chat tool - main inference capability
  server.tool(
    'chat',
    'Send a chat completion request to an LLM model. Supports all OpenAI-compatible parameters.',
    {
      model: z.string().describe('The model ID to use (e.g., "kimi-k2.7", "gpt-4o")'),
      messages: z
        .array(
          z.object({
            role: z.enum(['system', 'user', 'assistant']).describe('The role of the message sender'),
            content: z.string().describe('The content of the message'),
          })
        )
        .min(1)
        .describe('The messages to send to the model'),
      temperature: z.number().min(0).max(2).optional().describe('Sampling temperature (0-2)'),
      max_tokens: z.number().positive().optional().describe('Maximum tokens to generate'),
      privacy_tier: z
        .enum(['standard', 'no-log', 'tee'])
        .optional()
        .default('standard')
        .describe('Privacy level: standard, no-log (no request logging), or tee (trusted execution)'),
    },
    async (params, extra) => {
      // Get API key from session metadata (set during auth)
      const apiKey = extra.sessionId // Will be replaced with actual auth

      if (!apiKey) {
        return {
          content: [{ type: 'text' as const, text: 'Authentication required. Please provide a valid API key.' }],
          isError: true,
        }
      }

      try {
        // Call our API backend
        const apiUrl = process.env.API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            privacy_tier: params.privacy_tier,
            stream: false,
          }),
        })

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponse
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${errorData.error?.message || 'Request failed'}`,
              },
            ],
            isError: true,
          }
        }

        const result = (await response.json()) as ChatCompletionResponse

        // Return the assistant's response
        return {
          content: [
            {
              type: 'text' as const,
              text: result.choices[0]?.message?.content || '',
            },
          ],
          structuredContent: {
            id: result.id,
            model: result.model,
            content: result.choices[0]?.message?.content,
            usage: { ...result.usage },
            cost_usd: result.repogen?.cost_usd,
            provider: result.repogen?.provider,
            privacy_tier: result.repogen?.privacy_tier,
          } as Record<string, unknown>,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return {
          content: [
            {
              type: 'text' as const,
              text: `Request failed: ${errorMessage}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // Register list_models tool
  server.tool(
    'list_models',
    'List all available models with their pricing and capabilities.',
    {
      category: z
        .enum(['all', 'open', 'closed'])
        .optional()
        .default('all')
        .describe('Filter by model category'),
    },
    async (params) => {
      const models = Object.entries(MODELS)
        .filter(([, model]) => {
          if (params.category === 'all') return true
          if (params.category === 'open') return model.is_open
          if (params.category === 'closed') return !model.is_open
          return true
        })
        .map(([id, model]) => ({
          id,
          name: model.name,
          context_length: model.context_length,
          input_price_per_m: model.input_price_per_m,
          output_price_per_m: model.output_price_per_m,
          is_open: model.is_open,
          privacy_tiers: model.privacy_tiers,
          providers: model.providers,
        }))

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(models, null, 2),
          },
        ],
        structuredContent: { models, count: models.length },
      }
    }
  )

  // Register get_balance tool
  server.tool(
    'get_balance',
    'Get your current wallet balance and deposit address.',
    {
      _placeholder: z.string().optional().describe('Not used'),
    },
    async (_params, extra) => {
      const apiKey = extra.sessionId

      if (!apiKey) {
        return {
          content: [{ type: 'text' as const, text: 'Authentication required.' }],
          isError: true,
        }
      }

      try {
        const apiUrl = process.env.API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/v1/wallet`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponse
          return {
            content: [{ type: 'text' as const, text: `Error: ${errorData.error?.message || 'Failed to get balance'}` }],
            isError: true,
          }
        }

        const result = (await response.json()) as WalletResponse

        return {
          content: [
            {
              type: 'text' as const,
              text: `Balance: $${result.balance.available.toFixed(4)} USDC available\nDeposit Address: ${result.wallet.address}\nNetwork: Base`,
            },
          ],
          structuredContent: { ...result },
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return {
          content: [{ type: 'text' as const, text: `Failed: ${errorMessage}` }],
          isError: true,
        }
      }
    }
  )

  // Register a resource for model information
  server.resource(
    'models',
    'repogen://models',
    {
      description: 'List of all available models',
      mimeType: 'application/json',
    },
    async () => {
      const models = Object.entries(MODELS).map(([id, model]) => ({
        id,
        name: model.name,
        context_length: model.context_length,
        input_price_per_m: model.input_price_per_m,
        output_price_per_m: model.output_price_per_m,
        is_open: model.is_open,
      }))

      return {
        contents: [
          {
            uri: 'repogen://models',
            text: JSON.stringify(models, null, 2),
            mimeType: 'application/json',
          },
        ],
      }
    }
  )

  return server
}
