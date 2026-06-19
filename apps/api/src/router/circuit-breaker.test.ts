import { describe, it, expect, beforeEach } from 'vitest'
import {
  isProviderAvailable,
  recordSuccess,
  recordFailure,
  getCircuitState,
  resetCircuit,
  resetAllCircuits,
} from './circuit-breaker'

describe('Circuit Breaker', () => {
  beforeEach(() => {
    resetAllCircuits()
  })

  describe('isProviderAvailable', () => {
    it('returns true for new provider', () => {
      expect(isProviderAvailable('together')).toBe(true)
    })

    it('returns true after successful requests', () => {
      recordSuccess('together')
      recordSuccess('together')
      expect(isProviderAvailable('together')).toBe(true)
    })

    it('returns true after few failures (below threshold)', () => {
      recordFailure('together')
      recordFailure('together')
      recordFailure('together')
      expect(isProviderAvailable('together')).toBe(true)
    })

    it('returns false after threshold failures', () => {
      for (let i = 0; i < 5; i++) {
        recordFailure('together')
      }
      expect(isProviderAvailable('together')).toBe(false)
    })
  })

  describe('circuit state transitions', () => {
    it('starts in closed state', () => {
      const state = getCircuitState('together')
      expect(state.state).toBe('closed')
      expect(state.failures).toBe(0)
    })

    it('opens after threshold failures', () => {
      for (let i = 0; i < 5; i++) {
        recordFailure('together')
      }
      const state = getCircuitState('together')
      expect(state.state).toBe('open')
      expect(state.failures).toBe(5)
      expect(state.nextRetry).not.toBeNull()
    })

    it('resets failure count on success', () => {
      recordFailure('together')
      recordFailure('together')
      recordSuccess('together')
      const state = getCircuitState('together')
      expect(state.failures).toBe(0)
    })
  })

  describe('resetCircuit', () => {
    it('resets circuit to closed state', () => {
      for (let i = 0; i < 5; i++) {
        recordFailure('together')
      }
      expect(getCircuitState('together').state).toBe('open')

      resetCircuit('together')
      const state = getCircuitState('together')
      expect(state.state).toBe('closed')
      expect(state.failures).toBe(0)
    })
  })

  describe('isolation between providers', () => {
    it('maintains separate state per provider', () => {
      for (let i = 0; i < 5; i++) {
        recordFailure('together')
      }
      recordSuccess('fireworks')

      expect(isProviderAvailable('together')).toBe(false)
      expect(isProviderAvailable('fireworks')).toBe(true)
    })
  })
})
