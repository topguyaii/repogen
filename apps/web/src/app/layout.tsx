import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'repogen - The private inference layer for your agents',
  description: 'Point your agent at one endpoint and reach every model, open and closed. Pay per call in USDC, no account, no logs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
