import type { ChatCompletionRequest, ProviderId } from '@repogen/shared'
import { getProviderModelId } from '@repogen/shared'
import type { ProviderAdapter, AdapterResponse, AdapterStreamChunk } from './types'

export abstract class BaseAdapter implements ProviderAdapter {
  abstract readonly id: ProviderId
  abstract readonly name: string
  protected abstract readonly baseUrl: string
  protected abstract readonly apiKeyEnvVar: string

  protected get apiKey(): string {
    const key = process.env[this.apiKeyEnvVar]
    if (!key) {
      throw new Error(`Missing API key: ${this.apiKeyEnvVar}`)
    }
    return key
  }

  supportsModel(modelId: string): boolean {
    return getProviderModelId(this.id, modelId) !== undefined
  }

  getProviderModelId(modelId: string): string {
    const providerModelId = getProviderModelId(this.id, modelId)
    if (!providerModelId) {
      throw new Error(`Model ${modelId} not supported by ${this.name}`)
    }
    return providerModelId
  }

  abstract complete(request: ChatCompletionRequest): Promise<AdapterResponse>
  abstract stream(request: ChatCompletionRequest): AsyncGenerator<AdapterStreamChunk>

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to list models or make a minimal request
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Helper to build OpenAI-compatible request body
  protected buildRequestBody(request: ChatCompletionRequest, providerModelId: string): object {
    return {
      model: providerModelId,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stream: request.stream,
      stop: request.stop,
      presence_penalty: request.presence_penalty,
      frequency_penalty: request.frequency_penalty,
    }
  }
}
