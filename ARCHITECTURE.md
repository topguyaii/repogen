# repogen Architecture

This document describes the technical architecture of repogen, the decentralized inference layer for autonomous AI.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Authentication & Authorization](#authentication--authorization)
5. [Payment System](#payment-system)
6. [Decentralized Network](#decentralized-network)
7. [Security Model](#security-model)
8. [Infrastructure](#infrastructure)

---

## System Overview

repogen is a decentralized AI inference platform that connects clients (agents, developers) with a network of GPU contributors running open-source models.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│                                                                         │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                  │
│   │   Agents    │   │ Developers  │   │    Apps     │                  │
│   │(Claude Code)│   │  (Python)   │   │   (Web)     │                  │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                  │
│          │                 │                 │                          │
│          └─────────────────┼─────────────────┘                          │
│                            │                                            │
│                    OpenAI-compatible API                                │
│                      or MCP Protocol                                    │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         repogen API LAYER                               │
│                                                                         │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌───────────┐  │
│   │    Auth     │   │   Budget    │   │    Rate     │   │   Audit   │  │
│   │   (SIWE)    │   │   (USDC)    │   │   Limit     │   │(metadata) │  │
│   └─────────────┘   └─────────────┘   └─────────────┘   └───────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                        Router Service                            │  │
│   │              Route to optimal node in network                    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PETALS GATEWAY                                    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │              Python ↔ TypeScript Bridge                          │  │
│   │           Connects to Petals P2P Network                         │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DECENTRALIZED GPU NETWORK                            │
│                                                                         │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │ Node 1  │ │ Node 2  │ │ Node 3  │ │ Node 4  │ │ Node n  │          │
│   │ Layers  │ │ Layers  │ │ Layers  │ │ Layers  │ │ Layers  │          │
│   │  0-12   │ │ 12-24   │ │ 24-36   │ │ 36-48   │ │ 48-80   │          │
│   │         │ │         │ │         │ │         │ │         │          │
│   │ RTX4090 │ │  A100   │ │ RTX3090 │ │  H100   │ │   ...   │          │
│   │ Tokyo   │ │ Berlin  │ │   NYC   │ │ London  │ │   ...   │          │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                                         │
│   BitTorrent-style distribution: each node hosts model layers           │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BASE BLOCKCHAIN                                   │
│                                                                         │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐      │
│   │  USDC Escrow    │   │    Payments     │   │   Contributor   │      │
│   │    Contract     │   │   Settlement    │   │    Rewards      │      │
│   │                 │   │                 │   │                 │      │
│   │ deposit()       │   │ 80% → node      │   │ claimRewards()  │      │
│   │ withdraw()      │   │ 15% → protocol  │   │ getEarnings()   │      │
│   │ getBalance()    │   │ 5% → reserve    │   │                 │      │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘      │
│                                                                         │
│   Chain: Base (Coinbase L2)    Token: USDC (0x833589fCD6eDb6E08...)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Server (`apps/api`)

The main entry point for all inference requests. OpenAI-compatible.

```
apps/api/
├── src/
│   ├── index.ts              # Server entry point
│   ├── app.ts                # Hono app configuration
│   ├── routes/
│   │   ├── chat.ts           # POST /v1/chat/completions
│   │   ├── models.ts         # GET /v1/models
│   │   └── wallet.ts         # Wallet/balance endpoints
│   ├── auth/
│   │   ├── middleware.ts     # Bearer token validation
│   │   ├── api-key.ts        # Key generation & hashing
│   │   └── siwe.ts           # Sign-In with Ethereum
│   ├── budget/
│   │   ├── middleware.ts     # Pre-request budget check
│   │   ├── service.ts        # Budget reservation (Lua scripts)
│   │   └── scripts/          # Redis Lua scripts
│   ├── router/
│   │   └── index.ts          # Route to Petals network
│   ├── ratelimit/
│   │   └── service.ts        # Per-key, per-IP limits
│   └── audit/
│       └── logger.ts         # Metadata-only logging
└── package.json
```

**Key Design Decisions:**

| Decision | Rationale |
|----------|-----------|
| Hono framework | Lightweight, fast, TypeScript-native |
| Redis for state | Atomic operations, sub-ms latency |
| Lua scripts | Prevent race conditions in budget |
| No prompt logging | Privacy by design |

### 2. Petals Gateway (`apps/petals-gateway`)

Bridges the TypeScript API to the Python-based Petals network.

```
apps/petals-gateway/
├── src/
│   ├── index.ts              # Gateway entry point
│   ├── client.ts             # Petals client manager
│   ├── pool.ts               # Connection pooling
│   ├── health.ts             # Network health monitor
│   └── routes.ts             # Internal API
├── python/
│   ├── bridge.py             # Python ↔ TypeScript bridge
│   ├── inference.py          # Petals inference logic
│   └── requirements.txt      # Python dependencies
└── package.json
```

**How it works:**

1. API server sends inference request to gateway
2. Gateway spawns/reuses Python subprocess
3. Python uses Petals client to connect to P2P network
4. Response streams back through the bridge
5. Gateway forwards to API server (SSE)

### 3. Web Dashboard (`apps/web`)

Minimal dashboard for wallet connection and balance management.

```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   └── dashboard/        # Protected routes
│   ├── components/
│   │   ├── wallet-connect.tsx # RainbowKit integration
│   │   ├── balance.tsx       # USDC balance display
│   │   └── network-status.tsx # Decentralized network health
│   └── providers/
│       └── wagmi.tsx         # Wallet provider config
└── package.json
```

**Stack:**
- Next.js 14 (App Router)
- RainbowKit + wagmi (wallet connection)
- SIWE (authentication)
- Tailwind CSS

### 4. MCP Server (`apps/mcp`)

Model Context Protocol server for Claude Code, Cursor, etc.

```
apps/mcp/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── server.ts             # Tool definitions
│   └── http.ts               # HTTP transport
└── package.json
```

**Tools provided:**
- `chat` - Send inference request
- `list_models` - Get available models
- `get_balance` - Check USDC balance

### 5. GPU Contributor Node (`packages/node`)

CLI package for GPU contributors to join the network.

```
packages/node/
├── src/
│   ├── cli.ts                # CLI entry point
│   ├── server.ts             # Node registration
│   ├── petals.ts             # Petals server wrapper
│   ├── earnings.ts           # Track USDC earnings
│   └── metrics.ts            # Performance reporting
├── docker/
│   └── Dockerfile            # Easy deployment
└── package.json
```

**Usage:**
```bash
npx @repogen/node start --wallet 0x...
```

### 6. Smart Contracts (`packages/contracts`)

USDC escrow and payment contracts on Base.

```
packages/contracts/
├── src/
│   ├── Escrow.sol            # USDC deposit/withdraw
│   ├── PaymentSplitter.sol   # Revenue distribution
│   └── interfaces/
│       └── IERC20.sol        # USDC interface
├── test/
│   └── Escrow.t.sol          # Foundry tests
└── foundry.toml
```

**Escrow Contract:**
```solidity
contract RepogenEscrow {
    IERC20 public immutable usdc;

    mapping(address => uint256) public balances;

    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function deduct(address user, uint256 amount) external onlyOperator;
}
```

---

## Data Flow

### Inference Request Flow

```
1. Client Request
   │
   ├─► Auth: Verify wallet signature / API key
   │
   ├─► Budget: Check USDC balance sufficient
   │
   ├─► Rate Limit: Check not exceeding limits
   │
   ├─► Reserve: Lock estimated cost in Redis
   │
   ├─► Route: Select optimal network path
   │
   ├─► Petals Gateway: Forward to P2P network
   │
   ├─► GPU Nodes: Distributed inference
   │
   ├─► Stream: SSE response back to client
   │
   ├─► Settle: Deduct actual cost from escrow
   │
   └─► Reward: Credit GPU contributors
```

### Payment Flow

```
1. User deposits USDC to Escrow contract
   └─► escrow.deposit(amount)

2. User makes inference request
   └─► API reserves estimated cost in Redis

3. Inference completes
   └─► API calculates actual token usage

4. Settlement (batch or immediate)
   └─► escrow.deduct(user, actualCost)

5. Distribution (periodic)
   ├─► 80% to GPU contributor wallets
   ├─► 15% to protocol treasury
   └─► 5% to network reserve
```

---

## Authentication & Authorization

### Wallet-Native Auth (Primary)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│  RainbowKit │────►│    SIWE     │
│   (Browser) │     │   Connect   │     │   Sign In   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Generate   │
                                        │  API Key    │
                                        │(tied to     │
                                        │ wallet)     │
                                        └─────────────┘
```

1. User connects wallet (MetaMask, Rainbow, etc.)
2. Signs SIWE message to prove ownership
3. Receives API key tied to wallet address
4. Uses API key for subsequent requests

### API Key Format

```
rg_[environment]_[32_random_chars]

Examples:
- rg_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
- rg_test_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

**Security:**
- Keys hashed with SHA-256 before storage
- Original key never stored
- Revocation immediate via Redis

---

## Payment System

### USDC on Base

| Property | Value |
|----------|-------|
| Network | Base (Chain ID: 8453) |
| Token | USDC |
| Contract | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Decimals | 6 |

### Escrow Contract

```solidity
// Simplified interface
interface IRepogenEscrow {
    // User functions
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getBalance(address user) external view returns (uint256);

    // Operator functions (repogen API)
    function deduct(address user, uint256 amount) external;
    function batchDeduct(address[] users, uint256[] amounts) external;

    // Contributor functions
    function claimRewards() external;
    function getPendingRewards(address contributor) external view returns (uint256);
}
```

### Pricing Model

```
Cost = (input_tokens * input_price + output_tokens * output_price) / 1,000,000

Revenue Split:
├── 80% → GPU Contributor
├── 15% → Protocol Treasury
└── 5%  → Network Reserve
```

### Budget Enforcement

```lua
-- Redis Lua script (atomic)
local balance = redis.call('GET', 'balance:' .. wallet)
local reserved = redis.call('GET', 'reserved:' .. wallet)
local available = balance - reserved
local cost = ARGV[1]

if available < cost then
    return {0, 'insufficient_balance'}
end

redis.call('INCRBY', 'reserved:' .. wallet, cost)
return {1, 'ok'}
```

---

## Decentralized Network

### Petals Integration

repogen uses [Petals](https://github.com/bigscience-workshop/petals) for decentralized inference.

**How Petals works:**
1. Large model split into blocks (layers)
2. Each GPU node hosts subset of blocks
3. Inference request routes through nodes
4. Each node processes its blocks, passes to next
5. Final output returned to client

```
┌──────────────────────────────────────────────────────────────┐
│                    Llama 3.1 405B                            │
│                     (80 blocks)                              │
├────────┬────────┬────────┬────────┬────────┬────────┬───────┤
│Blocks  │Blocks  │Blocks  │Blocks  │Blocks  │Blocks  │Blocks │
│ 0-11   │ 12-23  │ 24-35  │ 36-47  │ 48-59  │ 60-71  │ 72-79 │
├────────┼────────┼────────┼────────┼────────┼────────┼───────┤
│ Node A │ Node B │ Node C │ Node D │ Node E │ Node F │Node G │
│RTX 4090│  A100  │RTX 3090│  H100  │RTX 4090│  A100  │RTX3090│
└────────┴────────┴────────┴────────┴────────┴────────┴───────┘
```

### Node Requirements

| GPU | VRAM | Blocks Hosted | Estimated Earnings |
|-----|------|---------------|-------------------|
| RTX 3080 | 10GB | 4-6 | $3-8/day |
| RTX 3090 | 24GB | 10-14 | $8-15/day |
| RTX 4090 | 24GB | 12-16 | $15-30/day |
| A100 40GB | 40GB | 20-28 | $40-80/day |
| H100 80GB | 80GB | 40-56 | $80-160/day |

### Network Health

Monitor at: `https://health.repogen.dev`

Metrics tracked:
- Active nodes
- Model availability
- Average latency
- Network throughput
- Geographic distribution

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Prompt logging | Never store prompts or responses |
| Key theft | Hash keys, never store plaintext |
| Overspending | Atomic budget checks (Lua scripts) |
| Node manipulation | Reputation system, multiple nodes per request |
| Contract exploit | Minimal contract, formal verification |
| DDoS | Rate limiting (per-key, per-IP, global) |

### Privacy Guarantees

```
What we store:
├── API key hash (SHA-256)
├── Wallet address
├── Token counts per request
├── Timestamps
└── Cost amounts

What we NEVER store:
├── Prompts
├── Responses
├── User content of any kind
└── Plaintext API keys
```

### Audit Trail

Metadata-only logging for debugging:

```json
{
  "request_id": "req_abc123",
  "timestamp": "2026-06-20T12:00:00Z",
  "wallet": "0x1234...5678",
  "model": "llama-3.1-405b",
  "input_tokens": 150,
  "output_tokens": 500,
  "latency_ms": 2340,
  "cost_usdc": 0.00052,
  "nodes_used": 3
}
```

---

## Infrastructure

### Production Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Cloudflare                            │
│                    (DNS, DDoS protection)                   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│                    (nginx/Caddy)                            │
└─────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   API Server    │ │   API Server    │ │   API Server    │
│   (Node.js)     │ │   (Node.js)     │ │   (Node.js)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     Redis       │ │   PostgreSQL    │ │ Petals Gateway  │
│   (Upstash)     │ │   (Supabase)    │ │   (Python)      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Environment Variables

```bash
# Required
BASE_RPC_URL=https://mainnet.base.org
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
ESCROW_CONTRACT_ADDRESS=0x...
REDIS_URL=redis://...
DATABASE_URL=postgresql://...

# Optional
API_PORT=3001
MCP_PORT=3002
WEB_PORT=3000
LOG_LEVEL=info
```

### Deployment

```bash
# Docker Compose (development)
docker-compose up -d

# Production (Railway/Render/Fly.io)
# See deployment guides in /docs
```

---

## Performance

### Targets

| Metric | Target | Current |
|--------|--------|---------|
| API latency (p50) | <100ms | ~50ms |
| API latency (p99) | <500ms | ~200ms |
| Inference (Llama 70B) | >10 tok/s | ~15 tok/s |
| Inference (Llama 405B) | >4 tok/s | ~6 tok/s |
| Uptime | 99.9% | - |

### Bottlenecks & Optimizations

| Bottleneck | Optimization |
|------------|--------------|
| Network latency | Geographic routing to nearest nodes |
| Model loading | Persistent connections, warm pools |
| Payment settlement | Batch transactions |
| Redis round-trips | Lua scripts, pipelining |

---

## Future Considerations

### Scaling

- Horizontal API scaling (stateless)
- Redis Cluster for budget state
- Multiple Petals gateway instances
- CDN for static assets

### Features

- Private swarms (dedicated node pools)
- Custom model hosting
- Fine-tuning support
- Streaming billing (WebSocket)

### Security

- Formal verification of contracts
- Bug bounty program
- Regular security audits
- TEE integration for gateway

---

## References

- [Petals Paper](https://arxiv.org/abs/2209.01188)
- [Base Documentation](https://docs.base.org)
- [USDC on Base](https://www.circle.com/en/usdc)
- [Sign-In with Ethereum](https://login.xyz)
- [RainbowKit](https://www.rainbowkit.com)

---

*Last updated: June 2026*
