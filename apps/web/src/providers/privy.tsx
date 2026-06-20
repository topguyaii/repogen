'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { base } from 'viem/chains'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

  // Debug: log app ID on mount
  if (typeof window !== 'undefined') {
    console.log('[Privy] App ID:', appId)
    console.log('[Privy] App ID length:', appId.length)
  }

  if (!appId) {
    console.error('[Privy] Missing NEXT_PUBLIC_PRIVY_APP_ID')
    return <div className="text-red-500 p-4">Error: Privy App ID not configured</div>
  }

  return (
    <PrivyProvider
      appId={appId}
      onSuccess={(user) => {
        console.log('[Privy] Login success:', user)
      }}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#FFFFFF',
          logo: 'https://www.image2url.com/r2/default/images/1781951336905-2b20f478-d9f4-4605-9e45-12893b7bc66d.png',
          showWalletLoginFirst: false,
          landingHeader: 'Sign in to repogen',
          loginMessage: 'Private inference for your agents',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: base,
        supportedChains: [base],
      }}
    >
      {children}
    </PrivyProvider>
  )
}
