# repogen: Decentralized AI Coordination Layer

## Vision

**repogen becomes the unified gateway to both centralized AND decentralized AI inference.**

One endpoint. All models. Any privacy level. Pay in USDC. Censorship resistant.

---

## The Problem

Today's AI infrastructure is controlled by a handful of companies:

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRALIZED AI                           │
│                                                             │
│  OpenAI    Anthropic    Google    Amazon    Microsoft       │
│                                                             │
│  • See all your data        • Can cut you off anytime       │
│  • Set prices unilaterally  • Subject to gov pressure       │
│  • Censor content           • Single points of failure      │
│  • Data monopolies          • Hinder open AI innovation     │
└─────────────────────────────────────────────────────────────┘
```

**This is unsustainable for:**
- Privacy-conscious users
- Autonomous agents that need reliable access
- Developers in restricted regions
- Anyone building on open AI principles

---

## The Solution: repogen as Coordination Layer

```
┌─────────────────────────────────────────────────────────────┐
│                        REPOGEN                              │
│              Decentralized AI Coordination Layer            │
│                                                             │
│  • Unified OpenAI-compatible API                            │
│  • USDC payments on Base (no banks, no KYC)                │
│  • Intelligent routing (speed vs privacy vs cost)           │
│  • Agent spend limits and controls                          │
│  • GPU contributor marketplace                              │
└─────────────────────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴──────────┐        │
         ▼                     ▼        ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│   CENTRALIZED   │  │           DECENTRALIZED                 │
│   PROVIDERS     │  │           GPU NETWORK                   │
│                 │  │                                         │
│  • Together     │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  • Fireworks    │  │  │GPU 1│ │GPU 2│ │GPU 3│ │GPU n│       │
│  • Groq         │  │  │     │ │     │ │     │ │     │       │
│  • OpenAI       │  │  │Tokyo│ │Berlin│ │NYC │ │...  │       │
│  • Anthropic    │  │  └─────┘ └─────┘ └─────┘ └─────┘       │
│                 │  │                                         │
│  Fast, reliable │  │  Privacy, censorship-resistant          │
│  but centralized│  │  community-owned compute                │
└─────────────────┘  └─────────────────────────────────────────┘
```

---

## Privacy Tiers

| Tier | Description | Use Case | Provider |
|------|-------------|----------|----------|
| `standard` | Fast, logged | General use | Together, Fireworks, etc. |
| `no-log` | Fast, no request logging | Sensitive queries | Selected providers |
| `tee` | Trusted Execution Environment | Enterprise compliance | TEE-enabled providers |
| `decentralized` | Distributed across volunteer nodes | Maximum privacy | Petals network |
| `private-swarm` | Your own GPU cluster | Enterprise, govt | Self-hosted nodes |

---

## Technical Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     repogen API                             │
│                   (OpenAI-compatible)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Router Service                           │
│                                                             │
│  • Model availability check                                 │
│  • Privacy tier routing                                     │
│  • Cost optimization                                        │
│  • Latency-based selection                                  │
│  • Fallback handling                                        │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Centralized │  │   Petals     │  │   Private    │
│  Provider    │  │   Gateway    │  │   Swarm      │
│  Adapter     │  │   Adapter    │  │   Adapter    │
└──────────────┘  └──────────────┘  └──────────────┘
          │                │                │
          ▼                ▼                ▼
   Together/etc      Petals Network    Customer Nodes
```

### Petals Gateway Service

New service that bridges repogen API to the Petals network:

```
apps/
├── api/              # Existing OpenAI-compatible API
├── mcp/              # Existing MCP server
├── web/              # Existing dashboard
└── petals-gateway/   # NEW: Petals network bridge
    ├── src/
    │   ├── client.ts        # Petals Python subprocess manager
    │   ├── pool.ts          # Connection pool to Petals
    │   ├── health.ts        # Network health monitoring
    │   ├── routes.ts        # HTTP endpoints
    │   └── index.ts
    └── python/
        └── petals_bridge.py # Python bridge to Petals
```

### GPU Contributor Node

Package for people to contribute GPUs:

```
packages/
└── node/                    # NEW: GPU contributor package
    ├── src/
    │   ├── server.ts        # Node registration & heartbeat
    │   ├── earnings.ts      # USDC earnings tracker
    │   ├── metrics.ts       # Performance metrics
    │   └── cli.ts           # CLI for node operators
    ├── docker/
    │   └── Dockerfile       # Easy deployment
    └── README.md
```

---

## Implementation Phases

### Phase 1: Petals Provider Integration (Week 1-2)

**Goal:** Add Petals as a provider option for decentralized inference.

#### Tasks:

1. **Create Petals Gateway Service**
   ```typescript
   // apps/petals-gateway/src/client.ts
   export class PetalsClient {
     private pythonProcess: ChildProcess

     async chat(messages: Message[], model: string): Promise<ChatResponse> {
       // Spawn Python process that uses Petals
       // Bridge response back to TypeScript
     }

     async getAvailableModels(): Promise<Model[]> {
       // Query health.petals.dev for available models
     }
   }
   ```

2. **Add Provider Configuration**
   ```typescript
   // packages/shared/src/providers.ts
   {
     id: 'petals',
     name: 'Petals Network',
     type: 'decentralized',
     models: ['llama-3.1-405b', 'mixtral-8x22b'],
     privacyTier: 'decentralized',
     baseUrl: 'http://localhost:3003', // Local gateway
   }
   ```

3. **Update Router Logic**
   ```typescript
   // apps/api/src/router/index.ts
   if (request.privacyTier === 'decentralized') {
     return routeToPetals(request)
   }
   ```

4. **Health Monitoring**
   - Poll health.petals.dev for network status
   - Track available models and capacity
   - Automatic fallback if Petals is slow

#### Deliverables:
- [ ] Petals gateway service running
- [ ] `privacy_tier: "decentralized"` working
- [ ] Fallback to centralized if needed
- [ ] Health dashboard showing Petals status

---

### Phase 2: GPU Contributor MVP (Week 3-4)

**Goal:** Allow people to contribute GPUs and earn USDC.

#### Tasks:

1. **Node Registration System**
   ```typescript
   // packages/node/src/server.ts
   export class ContributorNode {
     private walletAddress: string
     private gpuSpecs: GPUSpecs

     async register(): Promise<void> {
       // Register with repogen coordinator
       // Start Petals server
       // Begin heartbeat
     }

     async reportMetrics(): Promise<void> {
       // Report tokens processed
       // Report latency
       // Report uptime
     }
   }
   ```

2. **Earnings Tracking**
   ```typescript
   // packages/node/src/earnings.ts
   export class EarningsTracker {
     async recordInference(tokens: number, model: string): Promise<void> {
       // Track tokens processed
       // Calculate USDC earned
     }

     async getEarnings(): Promise<Earnings> {
       // Return pending + paid earnings
     }

     async requestPayout(): Promise<string> {
       // Trigger USDC payout to wallet
     }
   }
   ```

3. **Coordinator Service**
   ```typescript
   // apps/api/src/coordinator/index.ts
   export class NodeCoordinator {
     private nodes: Map<string, NodeInfo>

     async registerNode(node: NodeRegistration): Promise<void>
     async getHealthyNodes(model: string): Promise<NodeInfo[]>
     async recordWork(nodeId: string, work: WorkRecord): Promise<void>
     async calculatePayouts(): Promise<Payout[]>
   }
   ```

4. **Simple CLI for Contributors**
   ```bash
   npx @repogen/node start \
     --wallet 0x... \
     --gpu-memory 24GB
   ```

#### Deliverables:
- [ ] `@repogen/node` package published
- [ ] Node registration working
- [ ] Earnings tracking in dashboard
- [ ] Weekly USDC payouts

---

### Phase 3: Network Growth & Optimization (Week 5-8)

**Goal:** Scale the decentralized network and optimize performance.

#### Tasks:

1. **Reputation System**
   ```typescript
   interface NodeReputation {
     nodeId: string
     uptime: number           // 0-100%
     latency: number          // avg ms
     tokensProcessed: number
     successRate: number      // 0-100%
     stake: number            // USDC staked (optional)
   }
   ```

2. **Smart Routing**
   - Route to nodes with best reputation
   - Geographic proximity routing
   - Load balancing across nodes
   - Automatic failover

3. **Incentive Optimization**
   - Dynamic pricing based on demand
   - Bonus for high-uptime nodes
   - Penalty for failed requests

4. **Network Dashboard**
   - Real-time map of nodes
   - Aggregate network stats
   - Model availability
   - Contributor leaderboard

#### Deliverables:
- [ ] Reputation system live
- [ ] Smart routing algorithm
- [ ] Network dashboard
- [ ] 100+ active nodes

---

### Phase 4: Private Swarms (Week 9-12)

**Goal:** Enterprise offering - private GPU clusters.

#### Tasks:

1. **Private Swarm Configuration**
   ```typescript
   interface PrivateSwarm {
     id: string
     name: string
     nodes: string[]          // Whitelisted node IDs
     models: string[]         // Allowed models
     apiKeys: string[]        // Authorized API keys
     encryption: 'e2e' | 'tls'
   }
   ```

2. **Enterprise Features**
   - Dedicated node pools
   - End-to-end encryption
   - Compliance logging (optional)
   - SLA guarantees

3. **Self-Hosted Option**
   ```bash
   docker-compose -f repogen-private-swarm.yml up
   ```

#### Deliverables:
- [ ] Private swarm creation
- [ ] Enterprise dashboard
- [ ] Self-hosted deployment guide
- [ ] First enterprise customer

---

## Economic Model

### For Users (API Consumers)

| Privacy Tier | Price Multiplier | Why |
|--------------|------------------|-----|
| standard | 1.0x | Cheapest, centralized |
| no-log | 1.2x | Slight premium for privacy |
| tee | 1.5x | TEE hardware costs |
| decentralized | 0.8x - 1.2x | Variable, often cheaper |
| private-swarm | Custom | Based on node costs |

### For GPU Contributors

```
Revenue Split:
┌─────────────────────────────────────────────────┐
│                                                 │
│   User pays $0.10 per 1K tokens                │
│                                                 │
│   ├── 80% → GPU Contributor ($0.08)            │
│   ├── 15% → repogen Protocol ($0.015)          │
│   └── 5%  → Network Reserve ($0.005)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Estimated Contributor Earnings

| GPU | Tokens/day | Daily Earnings |
|-----|------------|----------------|
| RTX 3090 | ~500K | ~$4-8 |
| RTX 4090 | ~1M | ~$8-16 |
| A100 | ~5M | ~$40-80 |
| H100 | ~10M | ~$80-160 |

*Assumes consistent demand and 80% uptime*

---

## Supported Models (Initial)

### Via Petals Network

| Model | Size | Status |
|-------|------|--------|
| Llama 3.1 | 405B | Available |
| Llama 3.1 | 70B | Available |
| Mixtral | 8x22B | Available |
| Falcon | 180B | Available |

### Via Centralized (Fallback)

All existing providers (Together, Fireworks, Groq, etc.)

---

## API Changes

### New Parameters

```typescript
// Request
{
  "model": "llama-3.1-405b",
  "messages": [...],
  "repogen": {
    "privacy_tier": "decentralized",  // NEW
    "prefer_decentralized": true,     // NEW: prefer but allow fallback
    "max_latency_ms": 5000            // NEW: fallback if too slow
  }
}

// Response
{
  "choices": [...],
  "repogen": {
    "provider": "petals",             // Shows decentralized
    "privacy_tier": "decentralized",
    "nodes_used": 3,                  // NEW: how many nodes processed
    "cost_usd": 0.0012
  }
}
```

### New Endpoints

```
GET  /v1/network/status        # Decentralized network health
GET  /v1/network/nodes         # List active contributor nodes
POST /v1/network/register      # Register as contributor
GET  /v1/network/earnings      # Contributor earnings
POST /v1/network/payout        # Request USDC payout
```

---

## Dashboard Updates

### User Dashboard Additions

1. **Privacy Tier Selector**
   - Toggle between privacy levels
   - Show cost/speed tradeoffs
   - Network health indicator

2. **Decentralized Stats**
   - Requests via decentralized network
   - Nodes that processed your requests
   - Privacy metrics

### Contributor Dashboard (New)

1. **Node Status**
   - Current status (online/offline)
   - GPU utilization
   - Tokens processed today

2. **Earnings**
   - Pending earnings
   - Payout history
   - Projected monthly earnings

3. **Reputation**
   - Uptime score
   - Latency ranking
   - Network contribution rank

---

## Marketing Positioning

### Tagline Options

> "The private inference layer for autonomous AI"

> "One API. Every model. Your choice of privacy."

> "Decentralized AI inference. Pay in crypto. No censorship."

### Key Messages

1. **For Developers:**
   - Same OpenAI API, but with privacy options
   - Decentralized fallback = no single point of failure
   - USDC payments = no credit cards, global access

2. **For GPU Owners:**
   - Earn USDC while you sleep
   - Join the decentralized AI revolution
   - Help build censorship-resistant AI

3. **For the Movement:**
   - Break big tech's AI monopoly
   - Open source models + open compute
   - The people's AI infrastructure

---

## Success Metrics

### Phase 1 (Provider Integration)
- [ ] Petals requests working end-to-end
- [ ] <5s latency for 70B models
- [ ] 99% fallback success rate

### Phase 2 (Contributor Network)
- [ ] 50+ contributor nodes registered
- [ ] $1,000+ paid to contributors
- [ ] Working USDC payouts

### Phase 3 (Network Growth)
- [ ] 500+ active nodes
- [ ] 1M+ daily tokens via decentralized
- [ ] <2s average latency

### Phase 4 (Enterprise)
- [ ] 5+ private swarms deployed
- [ ] $10K+ monthly enterprise revenue
- [ ] SOC2 compliance (optional path)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Petals network slow/unreliable | Medium | High | Automatic fallback to centralized |
| Not enough GPU contributors | Medium | High | Strong incentives, easy onboarding |
| Regulatory concerns | Low | High | Privacy tiers give user choice |
| Security vulnerabilities | Medium | High | Security audit, bug bounty |
| Competitor copies approach | High | Medium | First mover, network effects |

---

## Timeline Summary

| Week | Milestone |
|------|-----------|
| 1-2 | Petals provider working |
| 3-4 | GPU contributor MVP |
| 5-6 | Reputation system |
| 7-8 | Network dashboard, 100 nodes |
| 9-10 | Private swarms beta |
| 11-12 | Enterprise launch |

---

## Next Steps

1. **Immediate:** Set up Petals gateway service
2. **This Week:** Get first decentralized request working
3. **Next Week:** Contributor node package MVP
4. **Ongoing:** Community building for GPU contributors

---

## Resources

- [Petals GitHub](https://github.com/bigscience-workshop/petals)
- [Petals Health Monitor](https://health.petals.dev)
- [USDC on Base](https://www.circle.com/en/usdc)
- [repogen API Docs](https://docs.repogen.xyz)

---

*This document is a living plan. Updates will be made as we learn and iterate.*

**Last Updated:** June 2026
