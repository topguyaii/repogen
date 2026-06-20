import { describe, it, expect, beforeEach } from 'vitest'
import {
  logAuditEntry,
  createAuditEntry,
  getRecentAuditEntries,
  clearAuditLog,
  verifyNoContent,
  type AuditLogEntry,
} from './logger'

describe('Audit Logger', () => {
  beforeEach(() => {
    clearAuditLog()
  })

  describe('createAuditEntry', () => {
    it('creates entry with correct fields', () => {
      const entry = createAuditEntry({
        requestId: 'req-123',
        apiKeyId: 'key-456',
        model: 'kimi-k2.7',
        provider: 'together',
        privacyTier: 'standard',
        promptTokens: 100,
        completionTokens: 50,
        costUsd: 0.001,
        latencyMs: 500,
        status: 'success',
      })

      expect(entry.request_id).toBe('req-123')
      expect(entry.api_key_id).toBe('key-456')
      expect(entry.model).toBe('kimi-k2.7')
      expect(entry.provider).toBe('together')
      expect(entry.privacy_tier).toBe('standard')
      expect(entry.prompt_tokens).toBe(100)
      expect(entry.completion_tokens).toBe(50)
      expect(entry.total_tokens).toBe(150)
      expect(entry.cost_usd).toBe(0.001)
      expect(entry.latency_ms).toBe(500)
      expect(entry.status).toBe('success')
      expect(entry.timestamp).toBeDefined()
    })

    it('includes error code on failure', () => {
      const entry = createAuditEntry({
        requestId: 'req-123',
        apiKeyId: 'key-456',
        model: 'kimi-k2.7',
        provider: 'together',
        privacyTier: 'standard',
        promptTokens: 100,
        completionTokens: 0,
        costUsd: 0,
        latencyMs: 100,
        status: 'error',
        errorCode: 'PROVIDER_ERROR',
      })

      expect(entry.status).toBe('error')
      expect(entry.error_code).toBe('PROVIDER_ERROR')
    })
  })

  describe('logAuditEntry', () => {
    it('logs standard tier entries', () => {
      const entry = createAuditEntry({
        requestId: 'req-123',
        apiKeyId: 'key-456',
        model: 'kimi-k2.7',
        provider: 'together',
        privacyTier: 'standard',
        promptTokens: 100,
        completionTokens: 50,
        costUsd: 0.001,
        latencyMs: 500,
        status: 'success',
      })

      logAuditEntry(entry)
      const entries = getRecentAuditEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0]).toEqual(entry)
    })

    it('logs no-log tier entries with minimal data', () => {
      const entry = createAuditEntry({
        requestId: 'req-123',
        apiKeyId: 'key-456',
        model: 'kimi-k2.7',
        provider: 'together',
        privacyTier: 'no-log',
        promptTokens: 100,
        completionTokens: 50,
        costUsd: 0.001,
        latencyMs: 500,
        status: 'success',
      })

      logAuditEntry(entry)
      const entries = getRecentAuditEntries()
      expect(entries).toHaveLength(1)
      // Entry is still stored for billing, but console output is minimal
    })

    it('logs TEE tier entries with minimal data', () => {
      const entry = createAuditEntry({
        requestId: 'req-123',
        apiKeyId: 'key-456',
        model: 'llama-4-maverick',
        provider: 'phala',
        privacyTier: 'tee',
        promptTokens: 100,
        completionTokens: 50,
        costUsd: 0.001,
        latencyMs: 500,
        status: 'success',
      })

      logAuditEntry(entry)
      const entries = getRecentAuditEntries()
      expect(entries).toHaveLength(1)
    })
  })

  describe('verifyNoContent', () => {
    it('returns true for valid audit entries', () => {
      const entry = createAuditEntry({
        requestId: 'req-123',
        apiKeyId: 'key-456',
        model: 'kimi-k2.7',
        provider: 'together',
        privacyTier: 'standard',
        promptTokens: 100,
        completionTokens: 50,
        costUsd: 0.001,
        latencyMs: 500,
        status: 'success',
      })

      expect(verifyNoContent(entry)).toBe(true)
    })

    it('returns false if entry contains content field', () => {
      const entry = {
        ...createAuditEntry({
          requestId: 'req-123',
          apiKeyId: 'key-456',
          model: 'kimi-k2.7',
          provider: 'together',
          privacyTier: 'standard',
          promptTokens: 100,
          completionTokens: 50,
          costUsd: 0.001,
          latencyMs: 500,
          status: 'success',
        }),
        // This should NOT be in an audit entry
        content: 'user message here',
      } as AuditLogEntry & { content: string }

      expect(verifyNoContent(entry as AuditLogEntry)).toBe(false)
    })
  })

  describe('getRecentAuditEntries', () => {
    it('returns entries in order', () => {
      for (let i = 0; i < 5; i++) {
        logAuditEntry(
          createAuditEntry({
            requestId: `req-${i}`,
            apiKeyId: 'key-456',
            model: 'kimi-k2.7',
            provider: 'together',
            privacyTier: 'standard',
            promptTokens: 100,
            completionTokens: 50,
            costUsd: 0.001,
            latencyMs: 500,
            status: 'success',
          })
        )
      }

      const entries = getRecentAuditEntries(3)
      expect(entries).toHaveLength(3)
      expect(entries[0].request_id).toBe('req-2')
      expect(entries[2].request_id).toBe('req-4')
    })
  })
})

describe('Privacy Compliance', () => {
  it('audit entries never contain user content', () => {
    // This test verifies the audit log structure prevents content leakage
    const entry = createAuditEntry({
      requestId: 'req-123',
      apiKeyId: 'key-456',
      model: 'kimi-k2.7',
      provider: 'together',
      privacyTier: 'no-log',
      promptTokens: 100,
      completionTokens: 50,
      costUsd: 0.001,
      latencyMs: 500,
      status: 'success',
    })

    // Verify the entry type doesn't allow content fields
    const keys = Object.keys(entry)
    expect(keys).not.toContain('content')
    expect(keys).not.toContain('messages')
    expect(keys).not.toContain('prompt')
    expect(keys).not.toContain('response')
    expect(keys).not.toContain('text')

    // Verify no content in serialized form
    expect(verifyNoContent(entry)).toBe(true)
  })
})
