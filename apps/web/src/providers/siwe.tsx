'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { SiweMessage } from 'siwe'

interface SiweContextType {
  isAuthenticated: boolean
  isLoading: boolean
  apiKey: string | null
  address: string | null
  signIn: () => Promise<void>
  signOut: () => void
  error: string | null
}

const SiweContext = createContext<SiweContextType | null>(null)

export function useSiwe() {
  const context = useContext(SiweContext)
  if (!context) {
    throw new Error('useSiwe must be used within a SiweProvider')
  }
  return context
}

interface SiweProviderProps {
  children: ReactNode
}

export function SiweProvider({ children }: SiweProviderProps) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('repogen_api_key')
    const storedAddress = localStorage.getItem('repogen_address')

    if (storedApiKey && storedAddress && address === storedAddress) {
      setApiKey(storedApiKey)
      setIsAuthenticated(true)
    } else if (address !== storedAddress) {
      // Clear session if wallet changed
      localStorage.removeItem('repogen_api_key')
      localStorage.removeItem('repogen_address')
      setApiKey(null)
      setIsAuthenticated(false)
    }
  }, [address])

  // Sign in with Ethereum
  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to repogen - Decentralized AI Inference',
        uri: window.location.origin,
        version: '1',
        chainId: 8453, // Base
        nonce: generateNonce(),
        issuedAt: new Date().toISOString(),
      })

      const messageToSign = message.prepareMessage()

      // Request signature
      const signature = await signMessageAsync({ message: messageToSign })

      // Verify and get API key from backend
      const response = await fetch('/api/auth/siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSign,
          signature,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Authentication failed')
      }

      const { apiKey: newApiKey } = await response.json()

      // Store session
      localStorage.setItem('repogen_api_key', newApiKey)
      localStorage.setItem('repogen_address', address)

      setApiKey(newApiKey)
      setIsAuthenticated(true)
    } catch (err) {
      console.error('SIWE sign-in error:', err)
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, signMessageAsync])

  // Sign out
  const signOut = useCallback(() => {
    localStorage.removeItem('repogen_api_key')
    localStorage.removeItem('repogen_address')
    setApiKey(null)
    setIsAuthenticated(false)
    disconnect()
  }, [disconnect])

  return (
    <SiweContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        apiKey,
        address: address || null,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </SiweContext.Provider>
  )
}

// Generate random nonce
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
