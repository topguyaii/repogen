# repogen Architecture

Technical architecture for repogen, the decentralized AI inference network.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Authentication](#authentication)
5. [Payment System](#payment-system)
6. [Network Protocol](#network-protocol)
7. [Security Model](#security-model)

---

## System Overview

repogen connects clients (agents, developers) with a network of GPU contributors running AI models.

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
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       COORDINATOR SERVICE                               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  Node Registry │ Work Distribution │ Health Monitor │ Payments  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    GPU CONTRIBUTOR NETWORK                              │
│                                                                         │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │ Node 1  │ │ Node 2  │ │ Node 3  │ │ Node 4  │ │ Node n  │          │
│   │         │ │         │ │         │ │         │ │         │          │
│   │ GLM-5.2 │ │ Llama   │ │ GLM-5.2 │ │DeepSeek │ │   ...   │          │
│   │ RTX4090 │ │  A100   │ │ RTX3090 │ │  H100   │ │   ...   │          │
│   │ Tokyo   │ │ Berlin  │ │   NYC   │ │ London  │ │   ...   │          │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BASE BLOCKCHAIN                                   │
│                                                                         │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐      │
│   │  USDC Escrow    │   │    Payments     │   │   Contributor   │      │
│   │    Contract     │   │   Settlement    │   │    Rewards      │      │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘      │
│                                                                         │
│   Chain: Base (ID: 8453)    Token: USDC                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Server (`apps/api`)

OpenAI-compatible entry point for all inference requests.

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── chat.ts           # POST /v1/chat/completions
│   │   ├── models.ts         # GET /v1/models
│   │   └── wallet.ts         # Balance endpoints
│   ├── auth/
│   │   ├── middleware.ts     # Bearer token validation
│   │   └── siwe.ts           # Sign-In with Ethereum
│   ├── budget/
│   │   └── service.ts        # Budget reservation
│   └── router/
│       └── index.ts          # Route to coordinator
└── package.json
```

### 2. Coordinator Service

Central service that manages the GPU network.

**Responsibilities:**
- Node registration and health tracking
- Work distribution and load balancing
- Model availability management
- Payment calculation

```
coordinator/
├── src/
│   ├── registry/
│   │   ├── nodes.ts          # Node registry
│   │   └── models.ts         # Model registry
│   ├── routing/
│   │   ├── selector.ts       # Node selection
│   │   └── balancer.ts       # Load balancing
│   ├── health/
│   │   └── monitor.ts        # Health checks
│   └── payments/
│       └── calculator.ts     # Earnings calculation
└── package.json
```

### 3. Contributor Node (`@repogen/node`)

CLI for GPU contributors to join the network.

```
packages/node/
├── src/
│   ├── cli.ts                # CLI entry point
│   ├── connection.ts         # Coordinator connection
│   ├── inference.ts          # Model inference
│   ├── gpu.ts                # GPU detection
│   └── metrics.ts            # Performance tracking
└── package.json
```

**Commands:**
```bash
npx @repogen/node start --wallet 0x...
npx @repogen/node status
npx @repogen/node earnings
```

### 4. Web Dashboard (`apps/web`)

User interface for wallet connection and balance management.

- Next.js 14 (App Router)
- RainbowKit + wagmi
- SIWE authentication
- Tailwind CSS

### 5. Smart Contracts (`packages/contracts`)

USDC escrow and payment on Base.

```solidity
contract RepogenEscrow {
    IERC20 public immutable usdc;

    mapping(address => uint256) public balances;

    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function settle(address user, uint256 amount) external onlyOperator;
    function claimRewards() external;
}
```

---

## Data Flow

### Inference Request

```
1. Client sends request to API
   │
   ├─► Auth: Verify API key
   │
   ├─► Budget: Check USDC balance
   │
   ├─► Reserve: Lock estimated cost
   │
   ├─► Route: Forward to coordinator
   │
   ├─► Coordinator: Select best node
   │
   ├─► Node: Execute inference
   │
   ├─► Stream: Response back to client
   │
   ├─► Settle: Deduct actual cost
   │
   └─► Reward: Credit contributor
```

### Payment Flow

```
1. User deposits USDC to escrow
   └─► escrow.deposit(amount)

2. User makes inference request
   └─► API reserves estimated cost

3. Inference completes
   └─► Calculate actual token usage

4. Settlement
   └─► escrow.settle(user, cost)

5. Contributor reward
   └─► contributor.claimRewards()
```

---

## Authentication

### Wallet-Native Auth

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
                                        └─────────────┘
```

1. User connects wallet
2. Signs SIWE message
3. Receives API key tied to wallet
4. Uses API key for requests

### API Key Format

```
rg_[env]_[32_random_chars]

Examples:
- rg_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
- rg_test_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

---

## Payment System

### USDC on Base

| Property | Value |
|----------|-------|
| Network | Base (Chain ID: 8453) |
| Token | USDC |
| Contract | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Decimals | 6 |

### Revenue Distribution

```
Request Revenue
├── 80% → GPU Contributor
├── 15% → Protocol Treasury
└── 5%  → Network Reserve
```

---

## Network Protocol

### Node ↔ Coordinator

Nodes maintain WebSocket connection to coordinator.

**Registration:**
```json
{
  "type": "register",
  "wallet": "0x...",
  "gpu": {
    "name": "NVIDIA RTX 4090",
    "vram": 24576,
    "compute": "8.9"
  },
  "models": ["glm-5.2", "llama-3.1-70b"]
}
```

**Heartbeat:**
```json
{
  "type": "heartbeat",
  "status": "ready",
  "load": 0.3,
  "latency_ms": 45
}
```

**Inference Request:**
```json
{
  "type": "inference",
  "request_id": "req_abc123",
  "model": "glm-5.2",
  "messages": [...],
  "stream": true
}
```

---

## Security Model

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Prompt logging | Never store prompts |
| Key theft | SHA-256 hashing |
| Overspending | Atomic budget checks |
| Node manipulation | Reputation system |
| Contract exploit | Minimal, audited |

### Privacy Guarantees

**What we store:**
- API key hash (SHA-256)
- Wallet address
- Token counts
- Timestamps

**What we NEVER store:**
- Prompts
- Responses
- User content

---

## Infrastructure

### Production Stack

```
Cloudflare (DNS, DDoS)
         │
         ▼
   Load Balancer
         │
    ┌────┼────┐
    ▼    ▼    ▼
   API  API  API
    │    │    │
    └────┼────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Redis  PG  Coordinator
```

### Environment Variables

```bash
BASE_RPC_URL=https://mainnet.base.org
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
REDIS_URL=redis://...
DATABASE_URL=postgresql://...
```

---

*Last updated: June 2026*
