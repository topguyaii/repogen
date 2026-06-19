import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'repogen-api', version: '0.1.0' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// Placeholder for v1 routes (Phase 1)
app.get('/v1/models', (c) => c.json({ object: 'list', data: [] }))

const port = Number(process.env.API_PORT) || 3001

console.log(`repogen api starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
