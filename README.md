<p align="center">
  <img src="apps/web/public/repogen_logo.png" alt="repogen" width="80" height="80" />
</p>

<h1 align="center">repogen</h1>

<p align="center">
  <strong>The decentralized inference layer for autonomous AI</strong>
</p>

<p align="center">
  One API. Open source models. Community-owned compute. Pay in USDC.
</p>

<p align="center">
  <a href="#why-repogen">Why</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#contribute-gpu">Contribute GPU</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/network-Base-0052FF?style=flat-square" alt="Base Network" />
  <img src="https://img.shields.io/badge/payment-USDC-2775CA?style=flat-square" alt="USDC" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/status-alpha-orange?style=flat-square" alt="Alpha" />
</p>

---

## The Problem

Today's AI infrastructure is controlled by a handful of corporations:

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRALIZED AI                           │
│                                                             │
│     OpenAI    Anthropic    Google    Amazon    Microsoft    │
│                                                             │
│     • See all your prompts       • Can cut you off anytime  │
│     • Set prices unilaterally    • Subject to gov pressure  │
│     • Censor content             • Single points of failure │
│     • Data monopolies            • Hinder open innovation   │
└─────────────────────────────────────────────────────────────┘
```

This is fundamentally incompatible with:
- **Privacy**: Your AI conversations are not private
- **Reliability**: APIs go down, rate limits hit, accounts banned
- **Autonomy**: Agents can't operate without human credit cards
- **Censorship resistance**: Content policies limit what AI can help with
- **Fair access**: Pricing favors wealthy nations and corporations

---

## The Solution

**repogen** is a decentralized inference layer that routes AI requests through a network of community-owned GPUs.

```
┌─────────────────────────────────────────────────────────────┐
│                        repogen                              │
│              Decentralized Inference Layer                  │
│                                                             │
│     • OpenAI-compatible API      • No logs, ever            │
│     • USDC payments on Base      • Censorship resistant     │
│     • Community-owned compute    • Unstoppable              │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  GPU 1  │      │  GPU 2  │      │  GPU n  │
    │ Tokyo   │      │ Berlin  │      │  NYC    │
    │         │      │         │      │         │
    │ Earning │      │ Earning │      │ Earning │
    │  USDC   │      │  USDC   │      │  USDC   │
    └─────────┘      └─────────┘      └─────────┘
```

---

## Why repogen?

| Centralized (OpenAI, etc.) | Decentralized (repogen) |
|---------------------------|-------------------------|
| They see your prompts | **No logs. Ever.** |
| Can ban your account | **Permissionless access** |
| Credit card required | **USDC on Base** |
| US/EU pricing | **Global, fair pricing** |
| Single point of failure | **Distributed network** |
| Closed source | **Fully open source** |
| They profit | **Contributors earn** |

---

## How It Works

### For Developers & Agents

1. **Connect wallet** (or just deposit USDC)
2. **Get API key** tied to your wallet
3. **Use OpenAI-compatible API**
4. **USDC deducted per request**

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.repogen.dev/v1",
    api_key="rg_..."  # Your repogen API key
)

response = client.chat.completions.create(
    model="llama-3.1-405b",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### For GPU Contributors

1. **Run one command**
2. **Contribute compute**
3. **Earn USDC**

```bash
npx @repogen/node start --wallet 0xYourAddress
```

That's it. Your GPU processes inference requests, you earn USDC automatically.

---

## Quick Start

### Option 1: Use the API

```bash
# Get your API key at https://repogen.dev

# Test it works
curl https://api.repogen.dev/v1/chat/completions \
  -H "Authorization: Bearer rg_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-70b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Option 2: MCP (Claude Code, Cursor, etc.)

Add to your MCP settings:

```json
{
  "mcpServers": {
    "repogen": {
      "command": "npx",
      "args": ["-y", "@repogen/mcp"],
      "env": {
        "REPOGEN_API_KEY": "rg_your_key"
      }
    }
  }
}
```

### Option 3: Python SDK

```bash
pip install repogen
```

```python
import repogen

client = repogen.Client(api_key="rg_...")
response = client.chat("What is the meaning of life?")
print(response)
```

---

## Contribute GPU

Join the decentralized network and earn USDC:

### Requirements
- NVIDIA GPU with 8GB+ VRAM (RTX 3080+, A100, H100)
- Linux or Windows with WSL
- Stable internet connection

### Start Contributing

```bash
# Install and start (one command)
npx @repogen/node start --wallet 0xYourWalletAddress

# Or with Docker
docker run -d --gpus all \
  -e WALLET_ADDRESS=0xYourWalletAddress \
  repogen/node:latest
```

### Estimated Earnings

| GPU | Daily Earnings* |
|-----|-----------------|
| RTX 3090 | $5-15 |
| RTX 4090 | $10-30 |
| A100 (40GB) | $50-100 |
| H100 | $100-200 |

*Depends on network demand and uptime

---

## Supported Models

All models run on the decentralized network:

| Model | Parameters | Speed | Use Case |
|-------|-----------|-------|----------|
| Llama 3.1 | 405B | ~6 tok/s | Most capable open model |
| Llama 3.1 | 70B | ~15 tok/s | Fast, high quality |
| Mixtral | 8x22B | ~10 tok/s | Great for code |
| DeepSeek V3 | 685B | ~4 tok/s | Reasoning tasks |
| Qwen 2.5 | 72B | ~12 tok/s | Multilingual |

More models added based on community demand.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Agent/App)                       │
│            OpenAI SDK / MCP / Direct HTTP                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     repogen API                             │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Auth     │  │   Budget    │  │   Router    │         │
│  │  (Wallet)   │  │  (USDC)     │  │  (Network)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Petals Gateway                             │
│           Bridge to Decentralized Network                   │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 GPU Contributor Network                     │
│                                                             │
│   Each node runs part of the model. Together they form      │
│   a distributed supercomputer for AI inference.             │
│                                                             │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│   │Node1│ │Node2│ │Node3│ │Node4│ │Node5│ │... │          │
│   │12-24│ │24-36│ │36-48│ │48-60│ │60-72│ │... │ blocks   │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Base Blockchain                          │
│                                                             │
│   • USDC escrow contract                                    │
│   • Payment settlement                                      │
│   • Contributor rewards                                     │
└─────────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

---

## Payment Model

**All payments in USDC on Base.**

### For Users
- **Deposit**: Send USDC to escrow contract or via wallet connect
- **Usage**: Deducted per request (token-based pricing)
- **Withdraw**: Anytime, instant, no fees

### For Contributors
- **Earn**: 80% of inference fees
- **Protocol**: 15% to repogen development
- **Reserve**: 5% for network stability

### Pricing

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Llama 3.1 405B | $0.80 | $0.80 |
| Llama 3.1 70B | $0.20 | $0.20 |
| Mixtral 8x22B | $0.30 | $0.30 |

*Prices may vary based on network demand*

---

## Roadmap

### Phase 1: Foundation ✅
- [x] OpenAI-compatible API
- [x] USDC payment system (Base)
- [x] Budget enforcement
- [x] MCP server
- [x] Rate limiting
- [x] Privacy-first logging (metadata only)

### Phase 2: Decentralization 🔄 (Current)
- [ ] Wallet-native auth (RainbowKit + SIWE)
- [ ] Petals network integration
- [ ] GPU contributor node package
- [ ] USDC escrow contract on Base

### Phase 3: Network Growth
- [ ] Reputation system for nodes
- [ ] Smart routing (latency, reliability)
- [ ] Network health dashboard
- [ ] Contributor leaderboard

### Phase 4: Scale
- [ ] 100+ active GPU nodes
- [ ] Sub-second routing
- [ ] Private swarms for enterprise
- [ ] Additional model support

See [ROADMAP.md](./ROADMAP.md) for detailed milestones.

---

## Project Structure

```
repogen/
├── apps/
│   ├── api/              # OpenAI-compatible inference API
│   ├── web/              # Dashboard & landing page
│   ├── petals-gateway/   # Bridge to decentralized network
│   └── mcp/              # MCP server for Claude Code
├── packages/
│   ├── node/             # GPU contributor CLI
│   ├── sdk/              # TypeScript/Python SDK
│   ├── contracts/        # USDC escrow (Solidity)
│   └── shared/           # Shared types & utilities
├── docs/                 # Documentation
└── scripts/              # Deployment & utilities
```

---

## Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.10+ (for Petals)
- Docker (optional)

### Setup

```bash
# Clone
git clone https://github.com/topguyaii/repogen.git
cd repogen

# Install dependencies
pnpm install

# Set environment
cp .env.example .env
# Edit .env with your config

# Run all services
pnpm dev

# API: http://localhost:3001
# MCP: http://localhost:3002
# Web: http://localhost:3000
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific package
pnpm --filter @repogen/api test
```

---

## Security

- **No logs**: We never store prompts or responses
- **Open source**: All code is auditable
- **Non-custodial**: You control your wallet and keys
- **Escrow contract**: Audited, minimal, immutable

Report vulnerabilities: security@repogen.dev

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md).

Priority areas:
- GPU node optimization
- Additional model support
- SDK for more languages
- Documentation improvements
- Security audits

---

## Community

- **Twitter**: [@repogen_ai](https://twitter.com/repogen_ai)
- **Discord**: [discord.gg/repogen](https://discord.gg/repogen)
- **GitHub**: [github.com/topguyaii/repogen](https://github.com/topguyaii/repogen)

---

## License

MIT License - See [LICENSE](./LICENSE)

---

<p align="center">
  <strong>Built for agents. Owned by the community. Unstoppable.</strong>
</p>

<p align="center">
  <sub>No big tech. No censorship. No logs. Just AI.</sub>
</p>
