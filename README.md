<p align="center">
  <img src="apps/web/public/repogen_logo.png" alt="repogen" width="80" height="80" />
</p>

<h1 align="center">repogen</h1>

<p align="center">
  <strong>Decentralized AI inference. Community-owned compute. USDC payments.</strong>
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
  <img src="https://img.shields.io/badge/status-development-yellow?style=flat-square" alt="Development" />
</p>

---

## The Problem

Today's AI infrastructure is controlled by a handful of corporations:

- **They see your prompts** — No privacy
- **They can cut you off** — No reliability
- **They set prices** — No fairness
- **They censor content** — No freedom
- **Single points of failure** — No resilience

This is incompatible with autonomous agents, privacy-conscious users, and open innovation.

---

## The Solution

**repogen** is a decentralized inference network where:

- **Community members contribute GPUs** and earn USDC
- **Developers access AI models** via OpenAI-compatible API
- **No one sees your prompts** — privacy by design
- **Payments in USDC on Base** — no credit cards, no accounts

```
┌─────────────────────────────────────────────────────────────┐
│                        repogen                              │
│              Decentralized Inference Network                │
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
| Single point of failure | **Distributed network** |
| Closed source | **Open source** |
| They profit | **Contributors earn** |

---

## How It Works

### For Developers & Agents

1. **Connect wallet** and sign in
2. **Get API key** tied to your wallet
3. **Use OpenAI-compatible API**
4. **Pay per request in USDC**

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.repogen.xyz/v1",
    api_key="rg_..."  # Your repogen API key
)

response = client.chat.completions.create(
    model="glm-5.2",
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

Your GPU processes inference requests, you earn USDC automatically.

---

## Quick Start

### Use the API

```bash
# Get your API key at https://repogen.xyz

curl https://api.repogen.xyz/v1/chat/completions \
  -H "Authorization: Bearer rg_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### MCP Integration (Claude Code, Cursor)

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

---

## Contribute GPU

Join the network and earn USDC:

### Requirements
- NVIDIA GPU with 8GB+ VRAM (RTX 3080+, A100, H100)
- Linux or Windows with WSL
- Stable internet connection

### Start Contributing

```bash
# Install and start
npx @repogen/node start --wallet 0xYourWalletAddress

# Or with Docker
docker run -d --gpus all \
  -e WALLET_ADDRESS=0xYourWalletAddress \
  repogen/node:latest
```

---

## Supported Models

| Model | Parameters | Use Case |
|-------|-----------|----------|
| GLM-5.2 | 744B MoE | Most capable, 1M context |
| Llama 3.1 | 405B | High quality open model |
| Llama 3.1 | 70B | Fast, balanced |
| DeepSeek V3.2 | 685B | Reasoning tasks |
| Qwen 2.5 | 72B | Multilingual |

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
│                  repogen Coordinator                        │
│           Routes requests to optimal nodes                  │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 GPU Contributor Network                     │
│                                                             │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│   │Node1│ │Node2│ │Node3│ │Node4│ │Node5│ │... │          │
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

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

---

## Roadmap

### Phase 1: Foundation ✅
- [x] OpenAI-compatible API
- [x] Wallet-native authentication (SIWE)
- [x] MCP server for Claude Code
- [x] Privacy-first design (no logging)

### Phase 2: Network 🔄 (Current)
- [ ] Coordinator service
- [ ] GPU contributor node package
- [ ] USDC escrow contract on Base

### Phase 3: Growth
- [ ] Reputation system for nodes
- [ ] Smart routing (latency, reliability)
- [ ] Network health dashboard

### Phase 4: Scale
- [ ] 100+ active GPU nodes
- [ ] Additional model support
- [ ] Enterprise features

See [ROADMAP.md](./ROADMAP.md) for details.

---

## Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (optional)

### Setup

```bash
git clone https://github.com/topguyaii/repogen.git
cd repogen

pnpm install
cp .env.example .env

pnpm dev
```

---

## Security

- **No logs**: We never store prompts or responses
- **Open source**: All code is auditable
- **Non-custodial**: You control your wallet and keys
- **Escrow contract**: Audited, minimal, immutable

Report vulnerabilities: security@repogen.xyz

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Community

- **Website**: [repogen.xyz](https://repogen.xyz)
- **Twitter**: [@repogen](https://x.com/repogen)
- **GitHub**: [github.com/topguyaii/repogen](https://github.com/topguyaii/repogen)

---

## License

MIT License - See [LICENSE](./LICENSE)

---

<p align="center">
  <strong>Decentralized AI. Owned by the community.</strong>
</p>
