import type { ChatCompletionRequest, ChatMessage } from '@repogen/shared'

// Mock provider for Phase 1 testing
// Will be replaced with real provider adapters in Phase 2

const MOCK_RESPONSES: Record<string, string> = {
  default: 'Hello! I am a mock response from repogen. This endpoint is working correctly. In Phase 2, this will be replaced with real provider responses.',
  greeting: 'Hello! How can I help you today?',
  test: 'This is a test response. The API is functioning correctly.',
}

// Simulate token counting (rough estimate)
export function countTokens(text: string): number {
  // Rough approximation: ~4 chars per token
  return Math.ceil(text.length / 4)
}

// Get mock response based on input
function getMockResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1]
  const content = lastMessage?.content.toLowerCase() || ''

  if (content.includes('hello') || content.includes('hi')) {
    return MOCK_RESPONSES.greeting
  }
  if (content.includes('test')) {
    return MOCK_RESPONSES.test
  }
  return MOCK_RESPONSES.default
}

// Generate non-streaming response
export async function generateMockResponse(
  request: ChatCompletionRequest
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const content = getMockResponse(request.messages)

  // Simulate some latency
  await new Promise((resolve) => setTimeout(resolve, 100))

  const promptTokens = request.messages.reduce((acc, m) => acc + countTokens(m.content), 0)
  const completionTokens = countTokens(content)

  return { content, promptTokens, completionTokens }
}

// Generate streaming response
export function generateMockStream(request: ChatCompletionRequest): ReadableStream<string> {
  const content = getMockResponse(request.messages)
  const words = content.split(' ')
  let index = 0

  return new ReadableStream({
    async pull(controller) {
      if (index >= words.length) {
        controller.close()
        return
      }

      // Simulate streaming delay
      await new Promise((resolve) => setTimeout(resolve, 50))

      const word = words[index]
      const text = index === 0 ? word : ' ' + word
      controller.enqueue(text)
      index++
    },
  })
}
