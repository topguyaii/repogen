# repogen Roadmap

This document tracks the development progress of repogen, the decentralized inference layer for autonomous AI.

## Overview

| Phase | Focus | Status | Timeline |
|-------|-------|--------|----------|
| 1 | Foundation | ✅ Complete | Done |
| 2 | Decentralization | 🔄 In Progress | Week 1-2 |
| 3 | Contributor Network | ⏳ Planned | Week 3-4 |
| 4 | Network Growth | ⏳ Planned | Week 5-6 |
| 5 | Production Launch | ⏳ Planned | Week 7-8 |

---

## Phase 1: Foundation ✅

**Status: Complete**

Core infrastructure for OpenAI-compatible API with USDC payments.

### Completed

- [x] **API Server** (`apps/api`)
  - [x] Hono HTTP server
  - [x] POST `/v1/chat/completions` (streaming SSE)
  - [x] GET `/v1/models` (list available models)
  - [x] Request validation (Zod schemas)
  - [x] Error handling (OpenAI format)

- [x] **Authentication**
  - [x] API key generation (`rg_live_*`, `rg_test_*`)
  - [x] SHA-256 key hashing (no plaintext storage)
  - [x] Bearer token middleware

- [x] **Budget System**
  - [x] Redis-backed spending limits
  - [x] Daily/task/total limits
  - [x] Atomic reservations (Lua scripts)
  - [x] Concurrent request handling

- [x] **Rate Limiting**
  - [x] Per-key limits (60/min)
  - [x] Per-IP limits (100/min)
  - [x] Global limits (10k/min)
  - [x] Key revocation

- [x] **Privacy**
  - [x] Metadata-only logging
  - [x] Never store prompts/responses
  - [x] Privacy tier routing

- [x] **MCP Server** (`apps/mcp`)
  - [x] `chat` tool
  - [x] `list_models` tool
  - [x] `get_balance` tool
  - [x] HTTP transport

- [x] **Testing**
  - [x] 52+ test cases
  - [x] Budget concurrency tests
  - [x] Payment flow tests
  - [x] Privacy verification tests

---

## Phase 2: Decentralization 🔄

**Status: In Progress**

Replace centralized providers with decentralized Petals network. Wallet-native authentication.

### Week 1: Wallet-Native Auth

- [ ] **Remove Privy**
  - [ ] Uninstall `@privy-io/react-auth`
  - [ ] Uninstall `@privy-io/server-auth`
  - [ ] Remove Privy provider from web app
  - [ ] Remove Privy wallet service from API

- [ ] **RainbowKit Integration**
  - [ ] Install `@rainbow-me/rainbowkit`
  - [ ] Install `wagmi` and `viem`
  - [ ] Configure Base chain
  - [ ] Create wallet connect component
  - [ ] Add USDC balance display

- [ ] **Sign-In with Ethereum (SIWE)**
  - [ ] Install `siwe` package
  - [ ] Create SIWE message generation
  - [ ] Implement signature verification
  - [ ] Generate API key on successful auth
  - [ ] Store wallet → API key mapping

- [ ] **Update Dashboard**
  - [ ] Wallet connect button
  - [ ] SIWE sign-in flow
  - [ ] Display connected wallet
  - [ ] Show USDC balance (on-chain read)
  - [ ] API key display (post-auth)

### Week 2: Petals Gateway

- [ ] **Create `apps/petals-gateway/`**
  - [ ] TypeScript service structure
  - [ ] Python subprocess manager
  - [ ] Inter-process communication
  - [ ] Health check endpoint

- [ ] **Python Bridge**
  - [ ] Install Petals (`pip install petals`)
  - [ ] Create `bridge.py` (stdin/stdout IPC)
  - [ ] Model initialization
  - [ ] Inference function
  - [ ] Streaming support

- [ ] **Gateway Routes**
  - [ ] POST `/inference` - run inference
  - [ ] GET `/health` - network status
  - [ ] GET `/models` - available models

- [ ] **Router Update**
  - [ ] Remove centralized provider adapters
  - [ ] Route all requests to Petals gateway
  - [ ] Handle gateway errors gracefully
  - [ ] Implement request queuing

- [ ] **Network Health Monitor**
  - [ ] Poll `health.petals.dev`
  - [ ] Cache model availability
  - [ ] Expose status endpoint
  - [ ] Alert on network issues

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Wallet auth | Connect wallet, sign message, get API key | ⏳ |
| No Privy | Zero custodial wallet dependencies | ⏳ |
| Petals gateway | Bridge to decentralized network | ⏳ |
| First decentralized request | End-to-end via Petals | ⏳ |

---

## Phase 3: Contributor Network ⏳

**Status: Planned (Week 3-4)**

Enable GPU owners to join the network and earn USDC.

### Week 3: Contributor Node

- [ ] **Create `packages/node/`**
  - [ ] CLI structure (`commander` or `yargs`)
  - [ ] Configuration file support
  - [ ] Logging (structured, levels)

- [ ] **Node Registration**
  - [ ] Connect to repogen coordinator
  - [ ] Submit GPU specs
  - [ ] Heartbeat mechanism
  - [ ] Graceful shutdown

- [ ] **Petals Server Wrapper**
  - [ ] Install Petals server
  - [ ] Auto-detect GPU capabilities
  - [ ] Select optimal model blocks
  - [ ] Start/stop management

- [ ] **Metrics Collection**
  - [ ] Tokens processed
  - [ ] Requests handled
  - [ ] Latency measurements
  - [ ] Uptime tracking

- [ ] **CLI Commands**
  ```bash
  npx @repogen/node start --wallet 0x...
  npx @repogen/node status
  npx @repogen/node earnings
  npx @repogen/node stop
  ```

### Week 4: Earnings & Payouts

- [ ] **USDC Escrow Contract**
  - [ ] Create `packages/contracts/`
  - [ ] `Escrow.sol` - deposit/withdraw
  - [ ] `PaymentSplitter.sol` - revenue distribution
  - [ ] Foundry test suite
  - [ ] Deploy to Base testnet
  - [ ] Deploy to Base mainnet

- [ ] **Earnings Tracking**
  - [ ] Track tokens processed per node
  - [ ] Calculate USDC earned
  - [ ] Store in Redis/PostgreSQL
  - [ ] API: GET `/v1/contributor/earnings`

- [ ] **Payout System**
  - [ ] Weekly payout batch
  - [ ] Minimum payout threshold ($5)
  - [ ] On-chain USDC transfer
  - [ ] Transaction history

- [ ] **Coordinator Service**
  - [ ] Node registry
  - [ ] Work distribution
  - [ ] Payout calculation
  - [ ] Fraud detection (basic)

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| `@repogen/node` | Published npm package | ⏳ |
| Easy onboarding | One command to start | ⏳ |
| Escrow contract | Deployed on Base | ⏳ |
| First payout | USDC to contributor | ⏳ |

---

## Phase 4: Network Growth ⏳

**Status: Planned (Week 5-6)**

Scale the network with reputation, smart routing, and dashboards.

### Week 5: Reputation System

- [ ] **Node Reputation**
  - [ ] Uptime score (0-100%)
  - [ ] Latency percentiles
  - [ ] Success rate
  - [ ] Tokens processed (volume)

- [ ] **Reputation Storage**
  - [ ] PostgreSQL schema
  - [ ] Rolling window calculations
  - [ ] Historical tracking

- [ ] **Smart Routing**
  - [ ] Route to high-reputation nodes
  - [ ] Geographic proximity
  - [ ] Load balancing
  - [ ] Failover to backup nodes

- [ ] **Incentives**
  - [ ] Bonus for high uptime
  - [ ] Penalty for failures
  - [ ] Minimum reputation threshold

### Week 6: Dashboard & Monitoring

- [ ] **Network Dashboard**
  - [ ] Live node map (global)
  - [ ] Aggregate statistics
  - [ ] Model availability
  - [ ] Network throughput

- [ ] **Contributor Dashboard**
  - [ ] Node status (online/offline)
  - [ ] Earnings history
  - [ ] Reputation score
  - [ ] Payout history

- [ ] **User Dashboard**
  - [ ] USDC balance
  - [ ] Usage history
  - [ ] Cost breakdown
  - [ ] API key management

- [ ] **Alerting**
  - [ ] Network health alerts
  - [ ] Low balance warnings
  - [ ] Node offline notifications

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Reputation system | Score nodes on performance | ⏳ |
| Smart routing | Route to best nodes | ⏳ |
| Network dashboard | Public health view | ⏳ |
| Contributor dashboard | Earnings and stats | ⏳ |

---

## Phase 5: Production Launch ⏳

**Status: Planned (Week 7-8)**

Security audit, documentation, and public launch.

### Week 7: Security & Testing

- [ ] **Security Audit**
  - [ ] Smart contract audit
  - [ ] API security review
  - [ ] Penetration testing
  - [ ] Fix identified issues

- [ ] **Load Testing**
  - [ ] Concurrent request handling
  - [ ] Network stress test
  - [ ] Payment flow under load
  - [ ] Identify bottlenecks

- [ ] **Documentation**
  - [ ] API reference (OpenAPI)
  - [ ] SDK documentation
  - [ ] Contributor guide
  - [ ] Troubleshooting guide

- [ ] **Legal**
  - [ ] Terms of Service
  - [ ] Privacy Policy
  - [ ] Contributor Agreement

### Week 8: Launch

- [ ] **Infrastructure**
  - [ ] Production deployment
  - [ ] CDN configuration
  - [ ] Monitoring (Grafana/Datadog)
  - [ ] Alerting (PagerDuty)

- [ ] **Launch Checklist**
  - [ ] All tests passing
  - [ ] Security audit passed
  - [ ] Documentation complete
  - [ ] Contracts verified on Basescan

- [ ] **Marketing**
  - [ ] Launch announcement
  - [ ] Twitter/X campaign
  - [ ] Discord community
  - [ ] Developer outreach

- [ ] **Beta Users**
  - [ ] Onboard first 100 users
  - [ ] Onboard first 50 contributors
  - [ ] Gather feedback
  - [ ] Iterate on issues

### Deliverables

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Security audit | Professional review | ⏳ |
| Documentation | Complete docs site | ⏳ |
| Production deploy | Live on mainnet | ⏳ |
| Public launch | Open to all | ⏳ |

---

## Success Metrics

### Phase 2 (Decentralization)
- [ ] First decentralized inference request
- [ ] <5s latency for Llama 70B
- [ ] Zero centralized provider dependencies

### Phase 3 (Contributor Network)
- [ ] 10+ active contributor nodes
- [ ] First USDC payout to contributor
- [ ] `@repogen/node` published on npm

### Phase 4 (Network Growth)
- [ ] 50+ active nodes
- [ ] 100K+ daily tokens processed
- [ ] <2s average routing latency

### Phase 5 (Production)
- [ ] 99.9% API uptime
- [ ] 100+ registered users
- [ ] $1K+ daily volume
- [ ] Zero security incidents

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Petals network slow | Medium | High | Queue requests, show estimated wait |
| Not enough contributors | Medium | High | Strong incentives, easy onboarding |
| Smart contract bug | Low | Critical | Audit, formal verification, bug bounty |
| Key theft | Low | High | Hash keys, rate limiting, revocation |
| DDoS attack | Medium | Medium | Cloudflare, rate limiting |

---

## Team Focus

| Week | Primary Focus | Secondary Focus |
|------|---------------|-----------------|
| 1 | Wallet-native auth | Dashboard UI |
| 2 | Petals gateway | Network health |
| 3 | Contributor node | CLI polish |
| 4 | Escrow contract | Payout system |
| 5 | Reputation system | Smart routing |
| 6 | Dashboards | Monitoring |
| 7 | Security audit | Documentation |
| 8 | Launch prep | Marketing |

---

## Changelog

### June 2026

- **Week 1**: Started Phase 2 - decentralization
- **Prior**: Completed Phase 1 - foundation (API, payments, MCP)

---

*This roadmap is updated weekly. Last update: June 20, 2026*
