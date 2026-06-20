'use client'

import { ReactNode } from 'react'
import { WalletProvider } from './wallet'
import { SiweProvider } from './siwe'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      <SiweProvider>
        {children}
      </SiweProvider>
    </WalletProvider>
  )
}

export { useSiwe } from './siwe'
