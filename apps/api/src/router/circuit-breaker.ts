import type { ProviderId } from '@repogen/shared'
import type { CircuitState, CircuitBreakerState } from '../adapters/types'

// Circuit breaker configuration
const CONFIG = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  resetTimeoutMs: 30000, // Try half-open after 30 seconds
  halfOpenMaxAttempts: 3, // Close circuit after 3 successful half-open attempts
}

// Store circuit breaker state per provider
const circuitStates: Map<ProviderId, CircuitBreakerState> = new Map()

// Initialize circuit breaker state
function getState(providerId: ProviderId): CircuitBreakerState {
  let state = circuitStates.get(providerId)
  if (!state) {
    state = {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      nextRetry: null,
    }
    circuitStates.set(providerId, state)
  }
  return state
}

// Check if provider is available (circuit not open)
export function isProviderAvailable(providerId: ProviderId): boolean {
  const state = getState(providerId)

  if (state.state === 'closed') {
    return true
  }

  if (state.state === 'open') {
    // Check if we should transition to half-open
    if (state.nextRetry && Date.now() >= state.nextRetry.getTime()) {
      state.state = 'half-open'
      return true
    }
    return false
  }

  // half-open - allow limited traffic
  return true
}

// Record a successful request
export function recordSuccess(providerId: ProviderId): void {
  const state = getState(providerId)

  if (state.state === 'half-open') {
    // Successful request in half-open state - close the circuit
    state.state = 'closed'
    state.failures = 0
    state.lastFailure = null
    state.nextRetry = null
  } else if (state.state === 'closed') {
    // Reset failure count on success
    state.failures = 0
  }
}

// Record a failed request
export function recordFailure(providerId: ProviderId): void {
  const state = getState(providerId)
  state.failures++
  state.lastFailure = new Date()

  if (state.state === 'half-open') {
    // Failure in half-open state - reopen the circuit
    state.state = 'open'
    state.nextRetry = new Date(Date.now() + CONFIG.resetTimeoutMs)
  } else if (state.state === 'closed' && state.failures >= CONFIG.failureThreshold) {
    // Too many failures - open the circuit
    state.state = 'open'
    state.nextRetry = new Date(Date.now() + CONFIG.resetTimeoutMs)
  }
}

// Get circuit state for monitoring
export function getCircuitState(providerId: ProviderId): CircuitBreakerState {
  return { ...getState(providerId) }
}

// Get all circuit states
export function getAllCircuitStates(): Map<ProviderId, CircuitBreakerState> {
  return new Map(circuitStates)
}

// Reset circuit breaker (for testing or manual recovery)
export function resetCircuit(providerId: ProviderId): void {
  circuitStates.set(providerId, {
    state: 'closed',
    failures: 0,
    lastFailure: null,
    nextRetry: null,
  })
}

// Reset all circuits
export function resetAllCircuits(): void {
  circuitStates.clear()
}
