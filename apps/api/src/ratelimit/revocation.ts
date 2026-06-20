import { getRedisClient } from '../lib/redis'

/**
 * API Key revocation management
 * Maintains a list of revoked keys that should be rejected immediately
 */

const REVOKED_KEYS_PREFIX = 'revoked:key'
const REVOKED_KEYS_TTL = 86400 * 30 // 30 days

export interface RevocationReason {
  reason: 'abuse' | 'billing' | 'user_request' | 'security' | 'admin'
  details?: string
  revokedAt: string
  revokedBy?: string
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  apiKeyId: string,
  reason: RevocationReason
): Promise<void> {
  const redis = getRedisClient()
  const key = `${REVOKED_KEYS_PREFIX}:${apiKeyId}`
  await redis.set(key, JSON.stringify(reason), 'EX', REVOKED_KEYS_TTL)
}

/**
 * Check if an API key is revoked
 */
export async function isApiKeyRevoked(
  apiKeyId: string
): Promise<RevocationReason | null> {
  const redis = getRedisClient()
  const key = `${REVOKED_KEYS_PREFIX}:${apiKeyId}`
  const data = await redis.get(key)

  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as RevocationReason
  } catch {
    return null
  }
}

/**
 * Unrevoke an API key
 */
export async function unrevokeApiKey(apiKeyId: string): Promise<void> {
  const redis = getRedisClient()
  const key = `${REVOKED_KEYS_PREFIX}:${apiKeyId}`
  await redis.del(key)
}

/**
 * Revoke API key due to abuse detection
 */
export async function revokeForAbuse(
  apiKeyId: string,
  details: string
): Promise<void> {
  await revokeApiKey(apiKeyId, {
    reason: 'abuse',
    details,
    revokedAt: new Date().toISOString(),
    revokedBy: 'system',
  })
}

/**
 * Revoke API key due to billing issues
 */
export async function revokeForBilling(
  apiKeyId: string,
  details: string
): Promise<void> {
  await revokeApiKey(apiKeyId, {
    reason: 'billing',
    details,
    revokedAt: new Date().toISOString(),
    revokedBy: 'system',
  })
}

/**
 * Check revocation in middleware
 */
export async function checkRevocation(apiKeyId: string): Promise<{
  revoked: boolean
  reason?: RevocationReason
}> {
  const reason = await isApiKeyRevoked(apiKeyId)
  return {
    revoked: reason !== null,
    reason: reason || undefined,
  }
}
