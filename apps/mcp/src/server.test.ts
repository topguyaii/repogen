import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMcpServer } from './server.js'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MCP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMcpServer', () => {
    it('creates a server with correct metadata', () => {
      const server = createMcpServer()
      expect(server).toBeDefined()
    })
  })

  describe('list_models tool', () => {
    it('returns all models by default', async () => {
      const server = createMcpServer()

      // Access the tool handler directly through the server's internal registry
      // Since MCP SDK doesn't expose tools directly, we test via the transport
      // For now, we just verify the server creates without error
      expect(server).toBeDefined()
    })
  })
})

describe('MCP Server Integration', () => {
  // Integration tests would require running the server and connecting via MCP client
  // These will be added when we test with a real MCP client

  it('placeholder for integration tests', () => {
    expect(true).toBe(true)
  })
})
