import { createServer } from 'http'
import { createMcpServer } from './server.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

const port = Number(process.env.MCP_PORT) || 3002
const apiUrl = process.env.API_URL || 'http://localhost:3001'

// Create MCP server
const mcpServer = createMcpServer()

// Create HTTP server with Streamable HTTP transport
const httpServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'repogen-mcp', version: '0.1.0' }))
    return
  }

  // MCP endpoint
  if (req.url === '/mcp' || req.url?.startsWith('/mcp')) {
    // Extract API key from Authorization header for session
    const authHeader = req.headers.authorization
    let apiKey: string | undefined

    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.slice(7)
    }

    // Create transport with session ID as API key (for auth)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => apiKey || 'anonymous',
    })

    // Handle the request
    try {
      await transport.handleRequest(req, res, req.url || '/mcp')

      // Connect server to transport for this request
      await mcpServer.connect(transport)
    } catch (error) {
      console.error('MCP request error:', error)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    }
    return
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

httpServer.listen(port, () => {
  console.log(`repogen MCP server running on http://localhost:${port}`)
  console.log(`API backend: ${apiUrl}`)
  console.log(`MCP endpoint: http://localhost:${port}/mcp`)
})
