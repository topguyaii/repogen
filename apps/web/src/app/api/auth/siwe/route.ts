import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { createHash, randomBytes } from 'crypto'

// In-memory store for development. In production, use Redis or PostgreSQL
const walletApiKeys = new Map<string, { keyHash: string; createdAt: Date }>()

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json()

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      )
    }

    // Parse and verify the SIWE message
    const siweMessage = new SiweMessage(message)

    // Verify the signature
    const verification = await siweMessage.verify({
      signature,
      domain: siweMessage.domain,
      nonce: siweMessage.nonce,
    })

    if (!verification.success) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const address = siweMessage.address.toLowerCase()

    // Check if wallet already has an API key
    const existing = walletApiKeys.get(address)
    if (existing) {
      // For security, we don't store plaintext keys
      // In production, user would need to regenerate if they lost their key
      // For now in dev, generate a new one
    }

    // Generate new API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)

    // Store the hashed key
    walletApiKeys.set(address, {
      keyHash,
      createdAt: new Date(),
    })

    // Return the plaintext key (only time it's available)
    return NextResponse.json({
      apiKey,
      address: siweMessage.address,
      message: 'Authentication successful',
    })
  } catch (error) {
    console.error('SIWE verification error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Generate a secure API key with repogen prefix
function generateApiKey(): string {
  const prefix = process.env.NODE_ENV === 'production' ? 'rg_live_' : 'rg_test_'
  const randomPart = randomBytes(32).toString('hex')
  return `${prefix}${randomPart}`
}

// Hash API key for secure storage (never store plaintext)
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// Verify an API key against stored hash
export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash
}

// Get wallet address by API key hash (for request authentication)
export function getWalletByKeyHash(keyHash: string): string | null {
  for (const [address, data] of walletApiKeys.entries()) {
    if (data.keyHash === keyHash) {
      return address
    }
  }
  return null
}
