import { describe, it, expect } from 'vitest'
import { app } from '../app'

describe('GET /v1/models', () => {
  it('returns a list of models', async () => {
    const res = await app.request('/v1/models')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.object).toBe('list')
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)

    // Check model structure
    const model = json.data[0]
    expect(model).toHaveProperty('id')
    expect(model).toHaveProperty('object', 'model')
    expect(model).toHaveProperty('owned_by', 'repogen')
    expect(model).toHaveProperty('repogen')
    expect(model.repogen).toHaveProperty('context_length')
    expect(model.repogen).toHaveProperty('input_price_per_m')
    expect(model.repogen).toHaveProperty('output_price_per_m')
  })

  it('includes known models', async () => {
    const res = await app.request('/v1/models')
    const json = await res.json()

    const modelIds = json.data.map((m: { id: string }) => m.id)
    expect(modelIds).toContain('llama-3.3-70b')
    expect(modelIds).toContain('gpt-4o')
  })
})

describe('GET /v1/models/:model', () => {
  it('returns a specific model', async () => {
    const res = await app.request('/v1/models/llama-3.3-70b')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.id).toBe('llama-3.3-70b')
    expect(json.object).toBe('model')
    expect(json.repogen.context_length).toBe(128000)
  })

  it('returns 404 for unknown model', async () => {
    const res = await app.request('/v1/models/nonexistent-model')
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.error.type).toBe('not_found_error')
    expect(json.error.message).toContain('nonexistent-model')
  })
})
