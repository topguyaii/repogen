# repogen MCP Server

Model Context Protocol (MCP) server for repogen - the private inference layer for AI agents.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the server
pnpm dev

# Server runs at http://localhost:3002
# MCP endpoint at http://localhost:3002/mcp
```

## Tools

### `chat`
Send a chat completion request to an LLM model.

**Parameters:**
- `model` (required): Model ID (e.g., "kimi-k2.7", "gpt-4o")
- `messages` (required): Array of messages with role and content
- `temperature` (optional): Sampling temperature (0-2)
- `max_tokens` (optional): Maximum tokens to generate
- `privacy_tier` (optional): "standard", "no-log", or "tee"

### `list_models`
List all available models with pricing and capabilities.

**Parameters:**
- `category` (optional): Filter by "all", "open", or "closed"

### `get_balance`
Get your current wallet balance and deposit address.

## Resources

### `repogen://models`
JSON resource containing all available models and their pricing.

## Claude Code Integration

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "repogen": {
      "url": "http://localhost:3002/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

For production:
```json
{
  "mcpServers": {
    "repogen": {
      "url": "https://mcp.repogen.xyz/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_PORT` | 3002 | Port to run MCP server |
| `API_URL` | http://localhost:3001 | Backend API URL |

## Testing

```bash
# Run tests
pnpm test

# Type check
pnpm typecheck
```
