import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { chatCompletions } from './routes/chat'
import { models } from './routes/models'
import { wallet } from './routes/wallet'
import { errorHandler } from './middleware/error-handler'
import { authMiddleware, optionalAuthMiddleware } from './auth/middleware'
import { budgetMiddleware } from './budget/middleware'
import { paymentMiddleware } from './wallet/middleware'
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

// Wallet management (requires auth)
app.use('/v1/wallet/*', authMiddleware)
app.use('/v1/wallet', authMiddleware)
app.route('/v1/wallet', wallet)

// Chat completions (requires auth, budget check, and payment)
app.use('/v1/chat/*', authMiddleware)
app.use('/v1/chat/*', budgetMiddleware)
app.use('/v1/chat/*', paymentMiddleware)
app.route('/v1/chat', chatCompletions)

// Ensure test key exists for development
if (process.env.NODE_ENV !== 'production') {
  const { key } = ensureTestKey()
  console.log(`Development API key: ${key}`)
}

export { app }
