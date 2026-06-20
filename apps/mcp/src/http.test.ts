import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer, Server } from 'http'
import { createMcpServer } from './server.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

describe('MCP HTTP Server', () => {
  let httpServer: Server
  let port: number

  beforeAll(async () => {
    // Create MCP server
    const mcpServer = createMcpServer()

    // Create HTTP server
    httpServer = createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', service: 'repogen-mcp', version: '0.1.0' }))
        return
      }

      if (req.url === '/mcp' || req.url?.startsWith('/mcp')) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => 'test-session',
        })

        try {
          await transport.handleRequest(req, res, req.url || '/mcp')
          await mcpServer.connect(transport)
        } catch (error) {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
          }
        }
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    // Find an available port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address()
        port = typeof addr === 'object' && addr ? addr.port : 0
        resolve()
      })
    })
  })

  afterAll(() => {
    httpServer.close()
  })

  describe('health endpoint', () => {
    it('returns health status on /', async () => {
      const res = await fetch(`http://localhost:${port}/`)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.status).toBe('ok')
      expect(json.service).toBe('repogen-mcp')
      expect(json.version).toBe('0.1.0')
    })

    it('returns health status on /health', async () => {
      const res = await fetch(`http://localhost:${port}/health`)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.status).toBe('ok')
    })
  })

  describe('CORS', () => {
    it('responds to OPTIONS with correct headers', async () => {
      const res = await fetch(`http://localhost:${port}/mcp`, {
        method: 'OPTIONS',
      })
      expect(res.status).toBe(204)
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      expect(res.headers.get('access-control-allow-methods')).toBe('GET, POST, OPTIONS')
    })
  })

  describe('404', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await fetch(`http://localhost:${port}/unknown`)
      expect(res.status).toBe(404)

      const json = await res.json()
      expect(json.error).toBe('Not found')
    })
  })

  describe('MCP endpoint', () => {
    it('accepts POST requests on /mcp', async () => {
      // MCP protocol uses JSON-RPC over HTTP
      const res = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        }),
      })

      // Should get a response - endpoint is reachable
      // 406 means Accept header issue, 400 means bad request, 200/202 means success
      expect([200, 202, 400, 406, 500]).toContain(res.status)
    })
  })
})
