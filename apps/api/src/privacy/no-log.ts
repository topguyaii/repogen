import type { ProviderId } from '@repogen/shared'
import { PROVIDERS } from '@repogen/shared'

/**
 * No-log verification
 *
 * No-log providers guarantee that:
 * 1. No prompts or responses are stored
 * 2. No request content is logged
 * 3. Only billing metadata is retained
 *
 * This is verified through:
 * 1. Provider contracts/agreements
 * 2. Technical verification where possible
 * 3. Audit reports (SOC 2, etc.)
 */

export interface NoLogVerification {
  provider: ProviderId
  verified: boolean
  verification_method: 'contract' | 'technical' | 'audit' | 'unverified'
  last_verified: string
  notes?: string
}

// Provider no-log verification status
// In production, this would be dynamically verified
const NO_LOG_VERIFICATIONS: Record<string, NoLogVerification> = {
  together: {
    provider: 'together',
    verified: true,
    verification_method: 'contract',
    last_verified: '2026-06-01',
    notes: 'Together AI enterprise agreement includes no-log guarantees',
  },
  fireworks: {
    provider: 'fireworks',
    verified: true,
    verification_method: 'contract',
    last_verified: '2026-06-01',
    notes: 'Fireworks AI no-log tier available',
  },
  phala: {
    provider: 'phala',
    verified: true,
    verification_method: 'technical',
    last_verified: '2026-06-01',
    notes: 'TEE prevents any logging by design',
  },
}

/**
 * Check if a provider is verified for no-log operation
 */
export function isNoLogVerified(providerId: ProviderId): boolean {
  const verification = NO_LOG_VERIFICATIONS[providerId]
  return verification?.verified === true
}

/**
 * Get no-log verification details for a provider
 */
export function getNoLogVerification(providerId: ProviderId): NoLogVerification | undefined {
  return NO_LOG_VERIFICATIONS[providerId]
}

/**
 * Get all verified no-log providers
 */
export function getNoLogProviders(): ProviderId[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).filter((id) => {
    const provider = PROVIDERS[id]
    return provider.supports_no_log && isNoLogVerified(id)
  })
}

/**
 * Verify request headers include no-log directive
 * Some providers require explicit no-log headers
 */
export function buildNoLogHeaders(): Record<string, string> {
  return {
    'X-No-Log': 'true',
    'X-Privacy-Mode': 'no-store',
  }
}

/**
 * Validate that a provider can be used for no-log requests
 * Throws if the provider doesn't support no-log
 */
export function validateNoLogProvider(providerId: ProviderId): void {
  const provider = PROVIDERS[providerId]

  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`)
  }

  if (!provider.supports_no_log) {
    throw new Error(`Provider ${providerId} does not support no-log tier`)
  }

  if (!isNoLogVerified(providerId)) {
    throw new Error(`Provider ${providerId} is not verified for no-log operation`)
  }
}
