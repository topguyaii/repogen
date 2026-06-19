import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { chatCompletions } from './routes/chat'
import { models } from './routes/models'
import { errorHandler } from './middleware/error-handler'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())
app.onError(errorHandler)

// Health checks
app.get('/', (c) => c.json({ status: 'ok', service: 'repogen-api', version: '0.1.0' }))
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }))

// OpenAI-compatible routes
app.route('/v1/chat', chatCompletions)
app.route('/v1', models)

export { app }
