import { createPublicClient, http, formatUnits, erc20Abi, type PublicClient } from 'viem'
import { base } from 'viem/chains'

// Configuration
const USDC_ADDRESS = (process.env.USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`
const USDC_DECIMALS = 6
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

// Viem public client for reading blockchain state (singleton)
let publicClient: PublicClient | null = null

export function getPublicClient(): PublicClient {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL),
    }) as PublicClient
  }
  return publicClient
}

/**
 * Get USDC balance for a wallet address.
 * Returns balance in USD (not wei).
 */
export async function getUsdcBalance(walletAddress: string): Promise<number> {
  const client = getPublicClient()

  const balance = await client.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress as `0x${string}`],
  })

  // Convert from 6 decimals to human-readable
  return parseFloat(formatUnits(balance, USDC_DECIMALS))
}

/**
 * Get ETH balance for gas fees.
 */
export async function getEthBalance(walletAddress: string): Promise<number> {
  const client = getPublicClient()

  const balance = await client.getBalance({
    address: walletAddress as `0x${string}`,
  })

  return parseFloat(formatUnits(balance, 18))
}

/**
 * Verify a transaction hash exists and is successful.
 */
export async function verifyTransaction(txHash: string): Promise<{
  success: boolean
  from?: string
  to?: string
  value?: bigint
}> {
  const client = getPublicClient()

  try {
    const receipt = await client.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    if (receipt.status !== 'success') {
      return { success: false }
    }

    const tx = await client.getTransaction({
      hash: txHash as `0x${string}`,
    })

    return {
      success: true,
      from: tx.from,
      to: tx.to || undefined,
      value: tx.value,
    }
  } catch {
    return { success: false }
  }
}

export { USDC_ADDRESS, USDC_DECIMALS }
