'use client'

import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

export function Header() {
  const [showDropdown, setShowDropdown] = useState(false)
  const { user, logout } = usePrivy()
  const { wallets } = useWallets()

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
  const email = user?.email?.address || ''
  const initial = email.charAt(0).toUpperCase() || 'U'
  const displayName = email.split('@')[0] || 'User'

  return (
    <header className="h-16 border-b border-white/10 bg-black flex items-center justify-end px-6">
      <div className="flex items-center gap-4">
        {/* Balance */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm text-white/60">Balance</span>
          <span className="text-sm font-medium text-white">$5.00</span>
          <button className="ml-1 p-1 hover:bg-white/10 rounded transition-colors">
            <WalletIcon className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
              {initial}
            </div>
            <span className="text-sm text-white">{displayName}</span>
            <ChevronDownIcon className="w-4 h-4 text-white/60" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-black border border-white/10 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-white/10">
                <p className="text-sm font-medium text-white">{email}</p>
                {embeddedWallet && (
                  <p className="text-xs text-white/50 mt-1 font-mono">
                    {embeddedWallet.address.slice(0, 6)}...{embeddedWallet.address.slice(-4)}
                  </p>
                )}
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    logout()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
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
