import type { Context, Next } from 'hono'
import { hashAPIKey, getAPIKeyByHash, isValidKeyFormat, type APIKeyData } from './api-key'
import { Errors } from '../middleware/error-handler'

// Extend Hono context to include API key data
declare module 'hono' {
  interface ContextVariableMap {
    apiKey: APIKeyData
    requestId: string
  }
}

/**
 * Authentication middleware - validates API key and adds to context.
 */
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  // Skip auth for health checks
  const path = c.req.path
  if (path === '/' || path === '/health') {
    return next()
  }

  // Extract API key from Authorization header
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    throw Errors.authentication('Missing Authorization header')
  }

  // Support both "Bearer <key>" and just "<key>"
  let apiKeyPlain: string
  if (authHeader.startsWith('Bearer ')) {
    apiKeyPlain = authHeader.slice(7)
  } else {
    apiKeyPlain = authHeader
  }

  // Validate key format
  if (!isValidKeyFormat(apiKeyPlain)) {
    throw Errors.authentication('Invalid API key format')
  }

  // Look up key
  const keyHash = hashAPIKey(apiKeyPlain)
  const apiKey = getAPIKeyByHash(keyHash)

  if (!apiKey) {
    throw Errors.authentication('Invalid API key')
  }

  if (!apiKey.isActive) {
    throw Errors.authentication('API key is inactive')
  }

  // Generate unique request ID
  const requestId = generateRequestId()

  // Add to context
  c.set('apiKey', apiKey)
  c.set('requestId', requestId)

  // Add request ID to response headers
  c.header('X-Request-ID', requestId)

  return next()
}

/**
 * Generate a unique request ID.
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `req_${timestamp}_${random}`
}

/**
 * Optional auth middleware - doesn't fail if no key provided.
 * Useful for endpoints that work with or without auth.
 */
export async function optionalAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    c.set('requestId', generateRequestId())
    return next()
  }

  return authMiddleware(c, next)
}
