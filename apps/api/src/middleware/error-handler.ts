import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

// OpenAI-compatible error types
export type OpenAIErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'permission_error'
  | 'not_found_error'
  | 'rate_limit_error'
  | 'server_error'
  | 'insufficient_quota'

export interface OpenAIError {
  error: {
    message: string
    type: OpenAIErrorType
    param?: string | null
    code?: string | null
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public type: OpenAIErrorType,
    public param?: string | null,
    public code?: string | null
  ) {
    super(message)
    this.name = 'APIError'
  }

  toJSON(): OpenAIError {
    return {
      error: {
        message: this.message,
        type: this.type,
        param: this.param ?? null,
        code: this.code ?? null,
      },
    }
  }
}

// Common error factories
export const Errors = {
  invalidRequest: (message: string, param?: string | null) =>
    new APIError(message, 400, 'invalid_request_error', param),

  authentication: (message = 'Invalid API key') =>
    new APIError(message, 401, 'authentication_error'),

  permission: (message: string) =>
    new APIError(message, 403, 'permission_error'),

  notFound: (message: string) =>
    new APIError(message, 404, 'not_found_error'),

  rateLimit: (message = 'Rate limit exceeded') =>
    new APIError(message, 429, 'rate_limit_error'),

  insufficientQuota: (message = 'Insufficient budget') =>
    new APIError(message, 402, 'insufficient_quota', null, 'insufficient_quota'),

  insufficientBalance: (message = 'Insufficient USDC balance. Please top up your wallet.') =>
    new APIError(message, 402, 'insufficient_quota', null, 'insufficient_balance'),

  internalError: (message = 'Internal server error') =>
    new APIError(message, 500, 'server_error'),

  server: (message = 'Internal server error') =>
    new APIError(message, 500, 'server_error'),
}

export const errorHandler: ErrorHandler = (err, c) => {
  // Handle our custom API errors
  if (err instanceof APIError) {
    return c.json(err.toJSON(), err.status as 400 | 401 | 402 | 403 | 404 | 429 | 500)
  }

  // Handle Hono HTTP exceptions
  if (err instanceof HTTPException) {
    const type: OpenAIErrorType =
      err.status === 401 ? 'authentication_error' :
      err.status === 403 ? 'permission_error' :
      err.status === 404 ? 'not_found_error' :
      err.status === 429 ? 'rate_limit_error' :
      err.status >= 500 ? 'server_error' :
      'invalid_request_error'

    return c.json(
      {
        error: {
          message: err.message,
          type,
          param: null,
          code: null,
        },
      },
      err.status
    )
  }

  // Handle unknown errors
  console.error('Unhandled error:', err)
  return c.json(
    {
      error: {
        message: 'An unexpected error occurred',
        type: 'server_error' as const,
        param: null,
        code: null,
      },
    },
    500
  )
}
