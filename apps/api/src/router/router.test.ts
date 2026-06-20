import { describe, it, expect, beforeEach } from 'vitest'
import { selectProvider, resetAllCircuits } from './index'
import type { RoutingContext } from '../adapters/types'

describe('Router', () => {
  beforeEach(() => {
    resetAllCircuits()
  })

  describe('selectProvider', () => {
    it('selects a provider for valid model', () => {
      const context: RoutingContext = {
        modelId: 'kimi-k2.7',
        strategy: 'cheapest',
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      expect(result.provider).toBeDefined()
      expect(result.providerId).toBeDefined()
      expect(result.providerModelId).toBeDefined()
    })

    it('throws for unknown model', () => {
      const context: RoutingContext = {
        modelId: 'nonexistent-model',
        strategy: 'cheapest',
        privacyTier: 'standard',
      }

      expect(() => selectProvider(context)).toThrow()
    })

    it('respects preferred provider when available', () => {
      const context: RoutingContext = {
        modelId: 'kimi-k2.7',
        strategy: 'specific',
        preferredProvider: 'fireworks',
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      expect(result.providerId).toBe('fireworks')
    })

    it('falls back when preferred provider unavailable', () => {
      const context: RoutingContext = {
        modelId: 'gpt-4o', // Only available on OpenAI
        strategy: 'specific',
        preferredProvider: 'together', // Doesn't support GPT-4o
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      expect(result.providerId).toBe('openai')
    })

    it('filters by no-log privacy tier', () => {
      const context: RoutingContext = {
        modelId: 'kimi-k2.7',
        strategy: 'cheapest',
        privacyTier: 'no-log',
      }

      const result = selectProvider(context)
      // Together and Fireworks support no-log
      expect(['together', 'fireworks']).toContain(result.providerId)
    })

    it('throws when no provider supports required privacy tier', () => {
      const context: RoutingContext = {
        modelId: 'gpt-4o', // Closed model, no no-log support
        strategy: 'cheapest',
        privacyTier: 'no-log',
      }

      expect(() => selectProvider(context)).toThrow()
    })

    it('excludes specified providers', () => {
      const context: RoutingContext = {
        modelId: 'kimi-k2.7',
        strategy: 'cheapest',
        privacyTier: 'standard',
        excludeProviders: ['together'],
      }

      const result = selectProvider(context)
      expect(result.providerId).not.toBe('together')
    })

    it('returns cost estimates', () => {
      const context: RoutingContext = {
        modelId: 'kimi-k2.7',
        strategy: 'cheapest',
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      expect(result.estimatedCostPer1M).toBeDefined()
      expect(result.estimatedCostPer1M.input).toBeGreaterThan(0)
      expect(result.estimatedCostPer1M.output).toBeGreaterThan(0)
    })
  })

  describe('routing strategies', () => {
    it('cheapest strategy selects provider', () => {
      const context: RoutingContext = {
        modelId: 'llama-4-maverick',
        strategy: 'cheapest',
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      expect(result.provider).toBeDefined()
    })

    it('fastest strategy prefers Groq when available', () => {
      const context: RoutingContext = {
        modelId: 'llama-4-maverick', // Available on Groq
        strategy: 'fastest',
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      // Groq is ranked fastest
      expect(result.providerId).toBe('groq')
    })
  })

  describe('privacy tier routing', () => {
    it('routes to no-log providers for no-log tier', () => {
      const context: RoutingContext = {
        modelId: 'kimi-k2.7',
        strategy: 'cheapest',
        privacyTier: 'no-log',
      }

      const result = selectProvider(context)
      // Together and Fireworks are no-log verified
      expect(['together', 'fireworks', 'phala']).toContain(result.providerId)
    })

    it('routes to TEE provider for tee tier', () => {
      const context: RoutingContext = {
        modelId: 'llama-4-maverick', // Available on Phala
        strategy: 'cheapest',
        privacyTier: 'tee',
      }

      const result = selectProvider(context)
      // Only Phala supports TEE
      expect(result.providerId).toBe('phala')
    })

    it('throws when model not available on TEE provider', () => {
      const context: RoutingContext = {
        modelId: 'gpt-4o', // Not available on Phala
        strategy: 'cheapest',
        privacyTier: 'tee',
      }

      expect(() => selectProvider(context)).toThrow('No available providers')
    })

    it('routes closed models only to their provider', () => {
      const context: RoutingContext = {
        modelId: 'claude-sonnet-4',
        strategy: 'cheapest',
        privacyTier: 'standard',
      }

      const result = selectProvider(context)
      expect(result.providerId).toBe('anthropic')
    })

    it('rejects no-log for closed models', () => {
      const context: RoutingContext = {
        modelId: 'claude-sonnet-4',
        strategy: 'cheapest',
        privacyTier: 'no-log',
      }

      expect(() => selectProvider(context)).toThrow()
    })
  })
})
