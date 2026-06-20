'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { useSiwe } from '@/providers'
import { formatUnits, erc20Abi } from 'viem'

// USDC contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const

export function Header() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const { address } = useAccount()
  const { signOut, apiKey } = useSiwe()

  // Fetch USDC balance on Base
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id,
  })

  const formattedBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance, 6)).toFixed(2)
    : '0.00'

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''

  return (
    <header className="h-16 border-b border-white/10 bg-black flex items-center justify-end px-6">
      <div className="flex items-center gap-4">
        {/* USDC Balance */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <UsdcIcon className="w-4 h-4" />
          <span className="text-sm text-white/60">USDC</span>
          <span className="text-sm font-medium text-white">${formattedBalance}</span>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-white font-mono">{shortAddress}</span>
            <ChevronDownIcon className="w-4 h-4 text-white/60" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-black border border-white/10 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-white/10">
                <p className="text-xs text-white/50 mb-1">Connected Wallet</p>
                <p className="text-sm font-mono text-white">{address}</p>
              </div>

              {/* API Key Section */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/50">API Key</p>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs text-white/60 hover:text-white transition-colors"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                {apiKey && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-white/80 bg-white/5 px-2 py-1.5 rounded overflow-hidden">
                      {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      title="Copy API Key"
                    >
                      <CopyIcon className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    signOut()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function UsdcIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#2775CA" />
      <path
        d="M12 6.5v1M12 16.5v1M9.5 12c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5c-1.38 0-2.5-1.12-2.5-2.5z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}
