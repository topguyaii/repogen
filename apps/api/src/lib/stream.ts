import type { ChatCompletionChunk } from '@repogen/shared'

// Generate a unique ID for completions
export function generateCompletionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'chatcmpl-'
  for (let i = 0; i < 29; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

// Create an SSE data line
export function sseData(data: string): string {
  return `data: ${data}\n\n`
}

// Create the final SSE done message
export function sseDone(): string {
  return `data: [DONE]\n\n`
}

// Create a streaming chunk
export function createChunk(
  id: string,
  model: string,
  content: string,
  finishReason: 'stop' | 'length' | null = null
): ChatCompletionChunk {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: finishReason ? {} : { content },
        finish_reason: finishReason,
      },
    ],
  }
}

// Create the initial chunk with role
export function createInitialChunk(id: string, model: string): ChatCompletionChunk {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: { role: 'assistant', content: '' },
        finish_reason: null,
      },
    ],
  }
}

// Transform a ReadableStream of text chunks into SSE format
export function createSSEStream(
  id: string,
  model: string,
  contentStream: ReadableStream<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let isFirst = true

  return new ReadableStream({
    async start(controller) {
      const reader = contentStream.getReader()

      try {
        // Send initial chunk with role
        const initialChunk = createInitialChunk(id, model)
        controller.enqueue(encoder.encode(sseData(JSON.stringify(initialChunk))))

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // Send final chunk with finish_reason
            const finalChunk = createChunk(id, model, '', 'stop')
            controller.enqueue(encoder.encode(sseData(JSON.stringify(finalChunk))))
            controller.enqueue(encoder.encode(sseDone()))
            controller.close()
            break
          }

          // Send content chunk
          const chunk = createChunk(id, model, value)
          controller.enqueue(encoder.encode(sseData(JSON.stringify(chunk))))
        }
      } catch (error) {
        controller.error(error)
      }
    },
  })
}
