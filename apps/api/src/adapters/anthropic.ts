import type { ChatCompletionRequest, ProviderId } from '@repogen/shared'
import { BaseAdapter } from './base'
import type { AdapterResponse, AdapterStreamChunk } from './types'

// Adapter for Anthropic API (different format from OpenAI)
export class AnthropicAdapter extends BaseAdapter {
  readonly id: ProviderId = 'anthropic'
  readonly name = 'Anthropic'
  protected readonly baseUrl = 'https://api.anthropic.com/v1'
  protected readonly apiKeyEnvVar = 'ANTHROPIC_API_KEY'

  private convertMessages(messages: ChatCompletionRequest['messages']): {
    system?: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  } {
    let system: string | undefined
    const converted: Array<{ role: 'user' | 'assistant'; content: string }> = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content
      } else {
        converted.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    }

    return { system, messages: converted }
  }

  async complete(request: ChatCompletionRequest): Promise<AdapterResponse> {
    const providerModelId = this.getProviderModelId(request.model)
    const { system, messages } = this.convertMessages(request.messages)
    const startTime = Date.now()

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: providerModelId,
        messages,
        system,
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature,
        top_p: request.top_p,
        stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const latency = Date.now() - startTime

    // Extract text from content blocks
    const content = data.content
      ?.filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('') || ''

    return {
      content,
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason || 'stop',
      providerLatencyMs: latency,
    }
  }

  async *stream(request: ChatCompletionRequest): AsyncGenerator<AdapterStreamChunk> {
    const providerModelId = this.getProviderModelId(request.model)
    const { system, messages } = this.convertMessages(request.messages)

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: providerModelId,
        messages,
        system,
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature,
        top_p: request.top_p,
        stream: true,
        stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
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

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              yield { content: parsed.delta.text }
            }

            if (parsed.type === 'message_stop') {
              yield { content: '', finishReason: 'stop' }
            }

            if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
              const reason = parsed.delta.stop_reason === 'end_turn' ? 'stop' : parsed.delta.stop_reason
              yield { content: '', finishReason: reason }
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

  async healthCheck(): Promise<boolean> {
    // Anthropic doesn't have a models endpoint, so we do a minimal check
    try {
      // Just verify the API key format is present
      return !!this.apiKey && this.apiKey.startsWith('sk-ant-')
    } catch {
      return false
    }
  }
}
