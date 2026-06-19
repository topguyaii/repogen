import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../app'
import { ensureTestKey, clearAllKeys } from '../auth/api-key'
import { resetAllBudgets } from '../budget/service'

describe('POST /v1/chat/completions', () => {
  const TEST_API_KEY = 'rg_test_development_key_for_testing_only'

  const validRequest = {
    model: 'kimi-k2.7',
    messages: [{ role: 'user', content: 'Hello' }],
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_API_KEY}`,
  }

  beforeEach(() => {
    clearAllKeys()
    resetAllBudgets()
    ensureTestKey()
  })

  describe('non-streaming', () => {
    it('returns a valid completion', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(validRequest),
      })

      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.object).toBe('chat.completion')
      expect(json.model).toBe('kimi-k2.7')
      expect(json.choices).toHaveLength(1)
      expect(json.choices[0].message.role).toBe('assistant')
      expect(json.choices[0].message.content).toBeTruthy()
      expect(json.choices[0].finish_reason).toBe('stop')
      expect(json.usage).toHaveProperty('prompt_tokens')
      expect(json.usage).toHaveProperty('completion_tokens')
      expect(json.usage).toHaveProperty('total_tokens')
    })

    it('includes repogen extensions', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(validRequest),
      })

      const json = await res.json()
      expect(json.repogen).toBeDefined()
      expect(json.repogen.provider).toBeDefined()
      expect(json.repogen.privacy_tier).toBe('standard')
    })

    it('respects privacy_tier parameter', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...validRequest, privacy_tier: 'no-log' }),
      })

      const json = await res.json()
      expect(json.repogen.privacy_tier).toBe('no-log')
    })
  })

  describe('streaming', () => {
    it('returns SSE stream', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...validRequest, stream: true }),
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('text/event-stream')

      const text = await res.text()
      const lines = text.split('\n').filter((line) => line.startsWith('data: '))

      expect(lines.length).toBeGreaterThan(0)

      // Check first chunk has role
      const firstChunk = JSON.parse(lines[0].replace('data: ', ''))
      expect(firstChunk.object).toBe('chat.completion.chunk')
      expect(firstChunk.choices[0].delta).toHaveProperty('role', 'assistant')

      // Check last data line before [DONE]
      const lastDataLine = lines[lines.length - 2]
      const lastChunk = JSON.parse(lastDataLine.replace('data: ', ''))
      expect(lastChunk.choices[0].finish_reason).toBe('stop')

      // Check stream ends with [DONE]
      expect(text).toContain('data: [DONE]')
    })
  })

  describe('validation', () => {
    it('rejects missing model', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.type).toBe('invalid_request_error')
    })

    it('rejects empty messages', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ model: 'kimi-k2.7', messages: [] }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.type).toBe('invalid_request_error')
    })

    it('rejects unknown model', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          model: 'nonexistent-model',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.type).toBe('invalid_request_error')
      expect(json.error.param).toBe('model')
    })

    it('rejects invalid temperature', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...validRequest, temperature: 3 }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects unsupported privacy tier for model', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          model: 'gpt-4o', // GPT-4o only supports 'standard'
          messages: [{ role: 'user', content: 'Hi' }],
          privacy_tier: 'no-log',
        }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.message).toContain('privacy tier')
    })
  })

  describe('authentication', () => {
    it('rejects requests without auth header', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.type).toBe('authentication_error')
    })

    it('rejects requests with invalid API key', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer rg_test_invalid_key_12345678901234',
        },
        body: JSON.stringify(validRequest),
      })

      expect(res.status).toBe(401)
    })
  })
})

describe('Health endpoints', () => {
  it('GET / returns ok', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.service).toBe('repogen-api')
  })

  it('GET /health returns healthy', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('healthy')
  })
})
