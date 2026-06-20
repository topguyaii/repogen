'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

// Dev bypass - set to true to skip Privy auth during development
const DEV_BYPASS_AUTH = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated, login } = usePrivy()
  const [bypassAuth, setBypassAuth] = useState(false)

  useEffect(() => {
    // Check for dev bypass via URL param: ?bypass=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('bypass') === 'true' && process.env.NODE_ENV === 'development') {
        setBypassAuth(true)
      }
    }
  }, [])

  useEffect(() => {
    if (ready && !authenticated && !bypassAuth && !DEV_BYPASS_AUTH) {
      login()
    }
  }, [ready, authenticated, login, bypassAuth])

  // Dev bypass mode
  if (bypassAuth || DEV_BYPASS_AUTH) {
    return (
      <div className="flex h-screen bg-black text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400">Dev Mode: Auth bypassed. Add ?bypass=true to URL or set NEXT_PUBLIC_DEV_BYPASS_AUTH=true</p>
            </div>
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting to login
  if (!authenticated) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Redirecting to login...</p>
        </div>
      </div>
    )
  }

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
