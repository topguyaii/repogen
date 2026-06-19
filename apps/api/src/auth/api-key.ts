import { createHash, randomBytes } from 'crypto'

// API Key format: rg_live_<32 random chars> or rg_test_<32 random chars>
const KEY_PREFIX_LIVE = 'rg_live_'
const KEY_PREFIX_TEST = 'rg_test_'

export interface APIKeyData {
  id: string
  keyHash: string
  name: string | null
  dailyLimitUsd: number
  taskLimitUsd: number | null
  totalLimitUsd: number | null
  isActive: boolean
  createdAt: Date
}

// Generate a new API key
export function generateAPIKey(isTest = false): { key: string; hash: string } {
  const prefix = isTest ? KEY_PREFIX_TEST : KEY_PREFIX_LIVE
  const randomPart = randomBytes(24).toString('base64url')
  const key = prefix + randomPart

  return {
    key,
    hash: hashAPIKey(key),
  }
}

// Hash an API key for storage (never store plain keys)
export function hashAPIKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// Validate API key format
export function isValidKeyFormat(key: string): boolean {
  if (!key) return false
  if (!key.startsWith(KEY_PREFIX_LIVE) && !key.startsWith(KEY_PREFIX_TEST)) {
    return false
  }
  // Prefix (8 chars) + 32 chars of base64url
  return key.length >= 40
}

// Check if key is a test key
export function isTestKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX_TEST)
}

// Extract key ID from hash (first 8 chars for display)
export function getKeyIdFromHash(hash: string): string {
  return hash.substring(0, 8)
}

// In-memory store for development/testing (replace with DB in production)
const keyStore: Map<string, APIKeyData> = new Map()

// Store a new API key
export function storeAPIKey(data: APIKeyData): void {
  keyStore.set(data.keyHash, data)
}

// Look up API key by hash
export function getAPIKeyByHash(hash: string): APIKeyData | undefined {
  return keyStore.get(hash)
}

// Look up API key by plain key
export function getAPIKeyByKey(key: string): APIKeyData | undefined {
  const hash = hashAPIKey(key)
  return keyStore.get(hash)
}

// Create a default test key for development
export function ensureTestKey(): { key: string; data: APIKeyData } {
  const testKeyPlain = 'rg_test_development_key_for_testing_only'
  const hash = hashAPIKey(testKeyPlain)

  let data = keyStore.get(hash)
  if (!data) {
    data = {
      id: 'test-key-001',
      keyHash: hash,
      name: 'Development Test Key',
      dailyLimitUsd: 10.0,
      taskLimitUsd: 1.0,
      totalLimitUsd: 100.0,
      isActive: true,
      createdAt: new Date(),
    }
    keyStore.set(hash, data)
  }

  return { key: testKeyPlain, data }
}

// Clear all keys (for testing)
export function clearAllKeys(): void {
  keyStore.clear()
}
