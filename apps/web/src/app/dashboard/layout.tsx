'use client'

import { useAccount } from 'wagmi'
import { useSiwe } from '@/providers'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isConnected } = useAccount()
  const { isAuthenticated, isLoading, signIn, error } = useSiwe()

  // Not connected - show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-4">Connect Your Wallet</h1>
          <p className="text-white/60 mb-8">
            Connect your wallet to access the dashboard and start using decentralized AI inference.
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  // Connected but not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
          <p className="text-white/60 mb-8">
            Sign a message with your wallet to verify ownership and receive your API key.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={signIn}
            disabled={isLoading}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Signing...
              </span>
            ) : (
              'Sign In with Ethereum'
            )}
          </button>

          <div className="mt-6">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  // Authenticated - show dashboard
  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
