import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { chatCompletions } from './routes/chat'
import { models } from './routes/models'
import { errorHandler } from './middleware/error-handler'
import { authMiddleware, optionalAuthMiddleware } from './auth/middleware'
import { budgetMiddleware } from './budget/middleware'
import { ensureTestKey } from './auth/api-key'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())
app.onError(errorHandler)

// Health checks (no auth required)
app.get('/', (c) => c.json({ status: 'ok', service: 'repogen-api', version: '0.1.0' }))
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }))

// Models endpoint (optional auth - shows all models without auth, shows pricing with auth)
app.use('/v1/models/*', optionalAuthMiddleware)
app.route('/v1', models)

// Chat completions (requires auth and budget check)
app.use('/v1/chat/*', authMiddleware)
app.use('/v1/chat/*', budgetMiddleware)
app.route('/v1/chat', chatCompletions)

// Ensure test key exists for development
if (process.env.NODE_ENV !== 'production') {
  const { key } = ensureTestKey()
  console.log(`Development API key: ${key}`)
}

export { app }
