import { PrivyClient } from '@privy-io/node'
import { createPublicClient, http, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem'
import { base } from 'viem/chains'

// Privy client singleton
let privyClient: PrivyClient | null = null

// Viem public client for reading blockchain state
let publicClient: ReturnType<typeof createPublicClient> | null = null

// Configuration
const USDC_ADDRESS = (process.env.USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`
const USDC_DECIMALS = 6
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS as `0x${string}` | undefined

export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    const appId = process.env.PRIVY_APP_ID
    const appSecret = process.env.PRIVY_APP_SECRET

    if (!appId || !appSecret) {
      throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET must be set')
    }

    privyClient = new PrivyClient({
      appId,
      appSecret,
    })
  }
  return privyClient
}

export function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL),
    })
  }
  return publicClient
}

export interface WalletInfo {
  id: string
  address: string
  chainType: string
  createdAt: number
}

/**
 * Create a new wallet for a user.
 * This wallet is controlled by our server (authorization key).
 */
export async function createWallet(userId: string): Promise<WalletInfo> {
  const privy = getPrivyClient()

  // First create a user in Privy
  const user = await privy.users.create({
    createEthereumWallet: false, // We'll create it separately
    customMetadata: { repogenUserId: userId },
  })

  // Create an Ethereum wallet for the user
  const wallet = await privy.wallets.create({
    chainType: 'ethereum',
    owner: { userId: user.id },
  })

  return {
    id: wallet.id,
    address: wallet.address,
    chainType: wallet.chainType,
    createdAt: wallet.createdAt,
  }
}

/**
 * Create a server-controlled wallet (no user association).
 * Used for treasury or operational wallets.
 */
export async function createServerWallet(): Promise<WalletInfo> {
  const privy = getPrivyClient()

  const wallet = await privy.wallets.create({
    chainType: 'ethereum',
  })

  return {
    id: wallet.id,
    address: wallet.address,
    chainType: wallet.chainType,
    createdAt: wallet.createdAt,
  }
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
 * Transfer USDC from a user's wallet to the treasury.
 * Used for per-request payments.
 */
export async function transferToTreasury(
  walletId: string,
  amountUsd: number
): Promise<{ hash: string; amount: number }> {
  if (!TREASURY_ADDRESS) {
    throw new Error('TREASURY_WALLET_ADDRESS must be set')
  }

  const privy = getPrivyClient()

  // Encode the ERC20 transfer call
  const encodedData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [TREASURY_ADDRESS, parseUnits(amountUsd.toString(), USDC_DECIMALS)],
  })

  // Send transaction via Privy
  const { hash } = await privy.wallets.ethereum.sendTransaction(walletId, {
    caip2: 'eip155:8453', // Base mainnet
    params: {
      transaction: {
        to: USDC_ADDRESS,
        data: encodedData,
        chainId: 8453,
      },
    },
  })

  return { hash, amount: amountUsd }
}

/**
 * Transfer USDC from a user's wallet to any address.
 * Used for withdrawals.
 */
export async function transferUsdc(
  walletId: string,
  recipientAddress: string,
  amountUsd: number
): Promise<{ hash: string; amount: number }> {
  const privy = getPrivyClient()

  // Encode the ERC20 transfer call
  const encodedData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [recipientAddress as `0x${string}`, parseUnits(amountUsd.toString(), USDC_DECIMALS)],
  })

  // Send transaction via Privy
  const { hash } = await privy.wallets.ethereum.sendTransaction(walletId, {
    caip2: 'eip155:8453', // Base mainnet
    params: {
      transaction: {
        to: USDC_ADDRESS,
        data: encodedData,
        chainId: 8453,
      },
    },
  })

  return { hash, amount: amountUsd }
}

/**
 * Get wallet by ID.
 */
export async function getWallet(walletId: string): Promise<WalletInfo | null> {
  const privy = getPrivyClient()

  try {
    const wallet = await privy.wallets.get(walletId)
    return {
      id: wallet.id,
      address: wallet.address,
      chainType: wallet.chainType,
      createdAt: wallet.createdAt,
    }
  } catch {
    return null
  }
}
