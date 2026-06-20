'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createPublicClient, http, formatUnits, parseUnits, encodeFunctionData } from 'viem'
import { base } from 'viem/chains'

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6

// Minimal ERC20 ABI for balanceOf and transfer
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

export default function BillingPage() {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [isLoading, setIsLoading] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { wallets } = useWallets()

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
  const walletAddress = embeddedWallet?.address || ''

  // Fetch USDC balance
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return

    try {
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      })
      setUsdcBalance(formatUnits(balance, USDC_DECIMALS))
    } catch (err) {
      console.error('Failed to fetch balance:', err)
      setUsdcBalance('0.00')
    }
  }, [walletAddress])

  useEffect(() => {
    fetchBalance()
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [fetchBalance])

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
    }
  }

  const handleWithdraw = async () => {
    if (!embeddedWallet || !withdrawAmount || !withdrawAddress) return

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress)) {
      setError('Invalid wallet address')
      return
    }

    const amount = parseFloat(withdrawAmount)
    const balance = parseFloat(usdcBalance || '0')
    if (amount > balance) {
      setError('Insufficient balance')
      return
    }

    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      // Get the provider from the embedded wallet
      const provider = await embeddedWallet.getEthereumProvider()

      // Encode the transfer call
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [withdrawAddress as `0x${string}`, parseUnits(withdrawAmount, USDC_DECIMALS)],
      })

      // Send transaction
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: USDC_ADDRESS,
          data,
        }],
      })

      setTxHash(hash as string)
      setWithdrawAmount('')
      setWithdrawAddress('')

      // Refresh balance after a delay
      setTimeout(fetchBalance, 5000)
    } catch (err) {
      console.error('Withdraw failed:', err)
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setIsLoading(false)
    }
  }

  const displayBalance = usdcBalance !== null ? parseFloat(usdcBalance).toFixed(2) : '...'

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-white/60 mt-1">Manage your USDC balance for API usage.</p>
      </div>

      {/* Wallet */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-white/50">Your Wallet (Base)</p>
            <p className="text-sm font-mono mt-1">
              {walletAddress ? (
                <span className="flex items-center gap-2">
                  {walletAddress}
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <CopyIcon className="w-3.5 h-3.5 text-white/50" />
                  </button>
                </span>
              ) : (
                <span className="text-white/40">Loading...</span>
              )}
            </p>
          </div>
          <a
            href={walletAddress ? `https://basescan.org/address/${walletAddress}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
          >
            BaseScan
            <ExternalIcon className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Balance */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">USDC Balance</p>
            <p className="text-3xl font-semibold mt-1">${displayBalance}</p>
            <p className="text-xs text-white/40 mt-1">Available for API usage</p>
          </div>
          <button
            onClick={fetchBalance}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh balance"
          >
            <RefreshIcon className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw Tabs */}
      <div className="border border-white/10 rounded-xl bg-white/[0.02]">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => { setActiveTab('deposit'); setError(null); setTxHash(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'deposit' ? 'text-white border-b-2 border-white' : 'text-white/50'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setError(null); setTxHash(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'withdraw' ? 'text-white border-b-2 border-white' : 'text-white/50'
            }`}
          >
            Withdraw
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'deposit' ? (
            <>
              <p className="text-sm text-white/60 mb-4">
                Send USDC on Base to your wallet address to add funds.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <p className="text-xs text-white/50 mb-2">Send USDC to:</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-white flex-1 break-all">
                    {walletAddress || 'Loading...'}
                  </code>
                  <button
                    onClick={copyAddress}
                    disabled={!walletAddress}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <CopyIcon className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-white/40">
                <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Send USDC on Base network only. Funds appear automatically after confirmation.</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white/60 mb-4">
                Withdraw USDC to any wallet on Base.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {txHash && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">Withdrawal submitted!</p>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400/70 hover:text-green-400 flex items-center gap-1 mt-1"
                  >
                    View on BaseScan <ExternalIcon className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-sm text-white/50 block mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-white/20 placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 block mb-2">Amount (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20 placeholder:text-white/30"
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-1.5">Available: ${displayBalance}</p>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isLoading || !embeddedWallet || !withdrawAmount || !withdrawAddress}
                className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Withdraw'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}
