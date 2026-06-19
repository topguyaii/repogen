# repogen

**The private inference layer for your agents.**

Point your agent at one endpoint and reach every model, open and closed. Your agent pays per call in USDC, with no account and no logs. repogen routes each call to the right provider and caps what the agent can spend.

---

## Quick Start

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.repogen.xyz/v1",
    api_key="rg_live_...",
)

resp = client.chat.completions.create(
    model="llama-3.3-70b",
    messages=[{"role": "user", "content": "Hello"}],
)
```

Or add it to your agent's MCP config:

```json
{
  "mcpServers": {
    "repogen": {
      "url": "https://mcp.repogen.xyz",
      "headers": { "Authorization": "Bearer rg_live_..." }
    }
  }
}
```

---

## Features

- **Private by default** - We keep nothing but the token count needed to settle the bill. Never a prompt, never a reply.
- **Spend control built in** - Set a hard limit per agent, per task, and per day.
- **Pay per call, no account** - Your agent pays for each request in USDC over x402.
- **One endpoint, every model** - Open and closed models through a single API.

---

## Privacy Tiers

| Tier | Guarantee |
|------|-----------|
| **Standard** | repogen keeps only token count for billing. Provider follows its own data policy. |
| **No-log** | Request only sent to providers that store nothing. |
| **TEE-only** | Request runs inside a sealed hardware enclave. |

---

## Development

```bash
# Install dependencies
pnpm install

# Run all services
pnpm dev

# API: http://localhost:3001
# MCP: http://localhost:3002
# Web: http://localhost:3000
```

---

## Project Structure

```
repogen/
├── apps/
│   ├── api/          # OpenAI-compatible API
│   ├── mcp/          # MCP server
│   └── web/          # Landing + dashboard
├── packages/
│   ├── shared/       # Types, models, providers
│   └── db/           # Drizzle schema
└── PROGRESS.md       # Build progress
```

---

## License

MIT
