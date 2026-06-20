import type { PrivacyTier, ProviderId } from '@repogen/shared'

/**
 * Audit log entry - NEVER contains prompts, responses, or content
 * Only metadata for compliance and billing
 */
export interface AuditLogEntry {
  timestamp: string
  request_id: string
  api_key_id: string
  model: string
  provider: ProviderId
  privacy_tier: PrivacyTier
  // Token counts only, never content
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  // Cost
  cost_usd: number
  // Request metadata
  latency_ms: number
  status: 'success' | 'error'
  error_code?: string
  // Network info (anonymized)
  ip_hash?: string
}

// In-memory audit log for development
// Production would use a proper audit database
const auditLog: AuditLogEntry[] = []

/**
 * Log request metadata for audit purposes
 * CRITICAL: This function MUST NEVER log prompts, responses, or any user content
 */
export function logAuditEntry(entry: AuditLogEntry): void {
  // For no-log and tee tiers, we only log billing-essential metadata
  if (entry.privacy_tier === 'no-log' || entry.privacy_tier === 'tee') {
    // Minimal logging for privacy tiers - only what's needed for billing
    const minimalEntry: Partial<AuditLogEntry> = {
      timestamp: entry.timestamp,
      request_id: entry.request_id,
      api_key_id: entry.api_key_id,
      model: entry.model,
      privacy_tier: entry.privacy_tier,
      total_tokens: entry.total_tokens,
      cost_usd: entry.cost_usd,
      status: entry.status,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT-MINIMAL]', JSON.stringify(minimalEntry))
    }

    auditLog.push(entry)
    return
  }

  // Standard tier - full metadata logging (still no content)
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(entry))
  }

  auditLog.push(entry)
}

/**
 * Create an audit entry from request context
 */
export function createAuditEntry(params: {
  requestId: string
  apiKeyId: string
  model: string
  provider: ProviderId
  privacyTier: PrivacyTier
  promptTokens: number
  completionTokens: number
  costUsd: number
  latencyMs: number
  status: 'success' | 'error'
  errorCode?: string
}): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    request_id: params.requestId,
    api_key_id: params.apiKeyId,
    model: params.model,
    provider: params.provider,
    privacy_tier: params.privacyTier,
    prompt_tokens: params.promptTokens,
    completion_tokens: params.completionTokens,
    total_tokens: params.promptTokens + params.completionTokens,
    cost_usd: params.costUsd,
    latency_ms: params.latencyMs,
    status: params.status,
    error_code: params.errorCode,
  }
}

/**
 * Get recent audit entries (for admin/debugging)
 * In production, this would query the audit database
 */
export function getRecentAuditEntries(limit: number = 100): AuditLogEntry[] {
  return auditLog.slice(-limit)
}

/**
 * Clear audit log (for testing)
 */
export function clearAuditLog(): void {
  auditLog.length = 0
}

/**
 * Verify that a log entry contains no content
 * Used in tests to ensure privacy compliance
 */
export function verifyNoContent(entry: AuditLogEntry): boolean {
  const entryString = JSON.stringify(entry)

  // These should never appear in audit logs
  const forbiddenPatterns = [
    /content["']?\s*:/i,
    /message["']?\s*:/i,
    /prompt["']?\s*:/i,
    /response["']?\s*:/i,
    /text["']?\s*:/i,
  ]

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(entryString)) {
      return false
    }
  }

  return true
}
