import type { ChatCompletionRequest, ProviderId } from '@repogen/shared'
import { BaseAdapter } from './base'
import type { AdapterResponse, AdapterStreamChunk } from './types'

// Adapter for OpenAI-compatible APIs (Together, Fireworks, Groq, OpenAI)
export class OpenAICompatibleAdapter extends BaseAdapter {
  readonly id: ProviderId
  readonly name: string
  protected readonly baseUrl: string
  protected readonly apiKeyEnvVar: string

  constructor(config: {
    id: ProviderId
    name: string
    baseUrl: string
    apiKeyEnvVar: string
  }) {
    super()
    this.id = config.id
    this.name = config.name
    this.baseUrl = config.baseUrl
    this.apiKeyEnvVar = config.apiKeyEnvVar
  }

  async complete(request: ChatCompletionRequest): Promise<AdapterResponse> {
    const providerModelId = this.getProviderModelId(request.model)
    const startTime = Date.now()

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(this.buildRequestBody({ ...request, stream: false }, providerModelId)),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.name} API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const latency = Date.now() - startTime

    return {
      content: data.choices[0]?.message?.content || '',
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      finishReason: data.choices[0]?.finish_reason || 'stop',
      providerLatencyMs: latency,
    }
  }

  async *stream(request: ChatCompletionRequest): AsyncGenerator<AdapterStreamChunk> {
    const providerModelId = this.getProviderModelId(request.model)

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(this.buildRequestBody({ ...request, stream: true }, providerModelId)),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.name} API error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            return
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            const finishReason = parsed.choices?.[0]?.finish_reason

            if (delta?.content) {
              yield { content: delta.content }
            }

            if (finishReason) {
              yield { content: '', finishReason }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
