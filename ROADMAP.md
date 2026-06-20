# repogen Roadmap

Development roadmap for repogen, the decentralized AI inference network.

## Overview

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation | ✅ Complete |
| 2 | Network Infrastructure | 🔄 In Progress |
| 3 | Contributor Network | ⏳ Planned |
| 4 | Growth & Scale | ⏳ Planned |

---

## Phase 1: Foundation ✅

**Status: Complete**

Core API infrastructure with wallet-native authentication.

### Completed

- [x] **API Server** (`apps/api`)
  - [x] OpenAI-compatible endpoints
  - [x] POST `/v1/chat/completions` (streaming SSE)
  - [x] GET `/v1/models`
  - [x] Request validation (Zod schemas)

- [x] **Wallet-Native Auth**
  - [x] RainbowKit integration
  - [x] Sign-In with Ethereum (SIWE)
  - [x] API key generation tied to wallet
  - [x] SHA-256 key hashing

- [x] **Budget System**
  - [x] Redis-backed spending limits
  - [x] Atomic reservations (Lua scripts)
  - [x] Concurrent request handling

- [x] **Privacy**
  - [x] Metadata-only logging
  - [x] Never store prompts/responses

- [x] **MCP Server**
  - [x] `chat` tool
  - [x] `list_models` tool
  - [x] `get_balance` tool

---

## Phase 2: Network Infrastructure 🔄

**Status: In Progress**

Build the repogen coordinator and inference network.

### Coordinator Service

- [ ] **Node Registry**
  - [ ] Node registration endpoint
  - [ ] GPU specs submission
  - [ ] Health monitoring
  - [ ] Online/offline tracking

- [ ] **Work Distribution**
  - [ ] Request queue
  - [ ] Node selection algorithm
  - [ ] Load balancing
  - [ ] Failover handling

- [ ] **Model Management**
  - [ ] Model registry
  - [ ] Node → model mapping
  - [ ] Availability tracking

### Inference Protocol

- [ ] **Node Communication**
  - [ ] WebSocket connection to coordinator
  - [ ] Heartbeat mechanism
  - [ ] Request/response protocol
  - [ ] Streaming support

- [ ] **Security**
  - [ ] Node authentication
  - [ ] Request signing
  - [ ] Response verification

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Coordinator service | Central routing and coordination | ⏳ |
| Node protocol | Communication between coordinator and nodes | ⏳ |
| First inference | End-to-end request through network | ⏳ |

---

## Phase 3: Contributor Network ⏳

**Status: Planned**

Enable GPU owners to join the network and earn USDC.

### Contributor Node (`@repogen/node`)

- [ ] **CLI Package**
  - [ ] `npx @repogen/node start --wallet 0x...`
  - [ ] `npx @repogen/node status`
  - [ ] `npx @repogen/node earnings`
  - [ ] Configuration file support

- [ ] **GPU Detection**
  - [ ] Auto-detect NVIDIA GPUs
  - [ ] VRAM detection
  - [ ] Capability assessment

- [ ] **Model Loading**
  - [ ] Download models
  - [ ] Load into VRAM
  - [ ] Inference execution

- [ ] **Metrics**
  - [ ] Requests processed
  - [ ] Tokens generated
  - [ ] Latency tracking
  - [ ] Uptime monitoring

### USDC Escrow Contract

- [ ] **Smart Contract**
  - [ ] `deposit()` - Users deposit USDC
  - [ ] `withdraw()` - Users withdraw USDC
  - [ ] `settle()` - Deduct for usage
  - [ ] `claimRewards()` - Contributors claim earnings

- [ ] **Deployment**
  - [ ] Foundry test suite
  - [ ] Base testnet deployment
  - [ ] Security audit
  - [ ] Base mainnet deployment

### Earnings & Payouts

- [ ] **Tracking**
  - [ ] Tokens processed per node
  - [ ] USDC earned calculation
  - [ ] Pending rewards display

- [ ] **Settlement**
  - [ ] Periodic batch settlement
  - [ ] On-chain USDC transfer
  - [ ] Transaction history

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| `@repogen/node` | npm package for contributors | ⏳ |
| Escrow contract | USDC deposits/payouts on Base | ⏳ |
| First payout | USDC to contributor | ⏳ |

---

## Phase 4: Growth & Scale ⏳

**Status: Planned**

Reputation, smart routing, and network expansion.

### Reputation System

- [ ] **Node Scoring**
  - [ ] Uptime score
  - [ ] Latency percentiles
  - [ ] Success rate
  - [ ] Volume processed

- [ ] **Incentives**
  - [ ] Bonus for high reputation
  - [ ] Penalty for failures
  - [ ] Minimum threshold for payouts

### Smart Routing

- [ ] **Optimizations**
  - [ ] Route to high-reputation nodes
  - [ ] Geographic proximity
  - [ ] Load balancing
  - [ ] Automatic failover

### Dashboards

- [ ] **Network Dashboard**
  - [ ] Live node map
  - [ ] Aggregate statistics
  - [ ] Model availability

- [ ] **Contributor Dashboard**
  - [ ] Node status
  - [ ] Earnings history
  - [ ] Reputation score

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Reputation system | Score nodes on performance | ⏳ |
| Smart routing | Optimal node selection | ⏳ |
| Dashboards | Network and contributor views | ⏳ |

---

## Success Metrics

### Phase 2
- [ ] Coordinator service operational
- [ ] First inference through network
- [ ] < 5s latency for GLM-5.2

### Phase 3
- [ ] 10+ active contributor nodes
- [ ] First USDC payout to contributor
- [ ] `@repogen/node` published on npm

### Phase 4
- [ ] 50+ active nodes
- [ ] 99.9% API uptime
- [ ] < 2s average routing latency

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Not enough contributors | Medium | High | Strong incentives, easy onboarding |
| Smart contract bug | Low | Critical | Audit, formal verification |
| Network latency | Medium | Medium | Geographic routing, caching |
| DDoS attack | Medium | Medium | Rate limiting, Cloudflare |

---

*Last updated: June 2026*
