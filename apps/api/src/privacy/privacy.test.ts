import { describe, it, expect, beforeEach } from 'vitest'
import { isNoLogVerified, getNoLogProviders, validateNoLogProvider, buildNoLogHeaders } from './no-log'
import { verifyTEEAttestation, isProviderTEEVerified, generateRequestNonce } from './tee'
import type { TEEAttestation } from './tee'

describe('No-Log Verification', () => {
  describe('isNoLogVerified', () => {
    it('returns true for verified no-log providers', () => {
      expect(isNoLogVerified('together')).toBe(true)
      expect(isNoLogVerified('fireworks')).toBe(true)
      expect(isNoLogVerified('phala')).toBe(true)
    })

    it('returns false for non-no-log providers', () => {
      expect(isNoLogVerified('openai')).toBe(false)
      expect(isNoLogVerified('anthropic')).toBe(false)
      expect(isNoLogVerified('groq')).toBe(false)
    })
  })

  describe('getNoLogProviders', () => {
    it('returns list of verified no-log providers', () => {
      const providers = getNoLogProviders()
      expect(providers).toContain('together')
      expect(providers).toContain('fireworks')
      expect(providers).not.toContain('openai')
      expect(providers).not.toContain('anthropic')
    })
  })

  describe('validateNoLogProvider', () => {
    it('does not throw for valid no-log providers', () => {
      expect(() => validateNoLogProvider('together')).not.toThrow()
      expect(() => validateNoLogProvider('fireworks')).not.toThrow()
    })

    it('throws for non-no-log providers', () => {
      expect(() => validateNoLogProvider('openai')).toThrow('does not support no-log')
      expect(() => validateNoLogProvider('anthropic')).toThrow('does not support no-log')
    })
  })

  describe('buildNoLogHeaders', () => {
    it('returns correct no-log headers', () => {
      const headers = buildNoLogHeaders()
      expect(headers['X-No-Log']).toBe('true')
      expect(headers['X-Privacy-Mode']).toBe('no-store')
    })
  })
})

describe('TEE Attestation', () => {
  describe('verifyTEEAttestation', () => {
    it('rejects unknown providers', async () => {
      const attestation: TEEAttestation = {
        provider: 'unknown-provider',
        enclave_id: 'test-enclave',
        code_hash: 'sha256:abc123',
        timestamp: new Date().toISOString(),
        signature: 'sig123',
      }

      const result = await verifyTEEAttestation(attestation)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unknown TEE provider')
    })

    it('rejects expired attestations', async () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      const attestation: TEEAttestation = {
        provider: 'phala',
        enclave_id: 'test-enclave',
        code_hash: 'sha256:abc123',
        timestamp: oldDate.toISOString(),
        signature: 'sig123',
      }

      const result = await verifyTEEAttestation(attestation)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('accepts valid attestations from known providers', async () => {
      const attestation: TEEAttestation = {
        provider: 'phala',
        enclave_id: 'test-enclave',
        code_hash: 'sha256:a1b2c3d4e5f6...',
        timestamp: new Date().toISOString(),
        signature: 'sig123',
      }

      const result = await verifyTEEAttestation(attestation)
      expect(result.valid).toBe(true)
      expect(result.provider).toBe('phala')
    })
  })

  describe('isProviderTEEVerified', () => {
    it('returns true for Phala', async () => {
      const verified = await isProviderTEEVerified('phala')
      expect(verified).toBe(true)
    })

    it('returns false for non-TEE providers', async () => {
      expect(await isProviderTEEVerified('together')).toBe(false)
      expect(await isProviderTEEVerified('openai')).toBe(false)
    })
  })

  describe('generateRequestNonce', () => {
    it('generates unique nonces', () => {
      const nonce1 = generateRequestNonce()
      const nonce2 = generateRequestNonce()
      expect(nonce1).not.toBe(nonce2)
      expect(nonce1.length).toBe(64) // 32 bytes as hex
    })
  })
})
