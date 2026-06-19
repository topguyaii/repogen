# repogen - Build Progress

**The private inference layer for your agents.**

Point your agent at one endpoint and reach every model, open and closed. Your agent pays per call in USDC, with no account and no logs.

---

## Project Overview

| Component | Description | Status |
|-----------|-------------|--------|
| API | OpenAI-compatible inference gateway | Phase 1 Complete |
| MCP | Model Context Protocol server | Not Started |
| Web | Landing page + dashboard | Not Started |
| x402 | USDC payment settlement | Not Started |
| Deploy | Docker + Postgres + Redis | Not Started |

---

## Phase 0: Project Setup [COMPLETE]

**Goal:** Repository structure, tooling, and configuration.

- [x] Create GitHub repository
- [x] Initialize monorepo with pnpm workspaces
- [x] Set up TypeScript configuration
- [x] Set up ESLint + Prettier
- [x] Create initial directory structure
- [x] Create .env.example with all required secrets
- [x] Create .gitignore
- [x] Create this PROGRESS.md

**Definition of Done:** Clean repo with build tooling, ready for Phase 1. DONE

---

## Phase 1: Core API Foundation [COMPLETE]

**Goal:** OpenAI-compatible `/v1/chat/completions` endpoint with streaming.

- [x] Set up Hono API server in `apps/api`
- [x] Implement `/v1/chat/completions` endpoint
- [x] Support streaming (SSE) responses
- [x] Support non-streaming responses
- [x] Implement `/v1/models` endpoint
- [x] Request/response validation with Zod
- [x] Error handling matching OpenAI format
- [x] Basic health check endpoint
- [x] Unit tests for all endpoints (15 tests passing)
- [x] Mock provider for testing (real providers in Phase 2)

**Definition of Done:** API accepts OpenAI-format requests, streams responses, passes all tests. DONE

---

## Phase 2: Provider Routing & Multi-Model Support

**Goal:** Route requests to multiple providers (Together, Fireworks, Groq, OpenAI, Anthropic).

- [ ] Define provider adapter interface
- [ ] Implement Together.ai adapter
- [ ] Implement Fireworks adapter
- [ ] Implement Groq adapter
- [ ] Implement OpenAI adapter (for closed models)
- [ ] Implement Anthropic adapter (for Claude)
- [ ] Model registry with provider mappings
- [ ] Routing logic: cheapest, fastest, or specific provider
- [ ] Automatic failover on provider error
- [ ] Circuit breaker for unhealthy providers
- [ ] Health monitoring per provider
- [ ] Tests for routing logic and failover

**Definition of Done:** Requests route to correct provider, failover works, circuit breaker prevents cascading failures.

---

## Phase 3: Budget System & Spend Control

**Goal:** Hard spending limits per agent, per task, per day. Un-bypassable.

- [ ] Set up Postgres with Drizzle ORM in `packages/db`
- [ ] Design budget schema (agent budgets, task budgets, daily limits)
- [ ] Implement budget check middleware (runs before every request)
- [ ] Implement budget deduction after successful response
- [ ] Implement daily budget reset job
- [ ] API key generation with embedded budget limits
- [ ] Budget exceeded response (stop call, return error)
- [ ] Concurrent request handling (prevent race conditions)
- [ ] Redis for real-time budget tracking
- [ ] Unit tests for budget logic
- [ ] Concurrency tests (100 parallel requests, verify no overspend)
- [ ] Bypass attempt tests (verify limits cannot be circumvented)

**Definition of Done:** Budget system stops requests at limit, handles concurrency correctly, cannot be bypassed.

---

## Phase 4: x402 Payment Integration

**Goal:** Pay-per-call with USDC over x402 protocol. No prepaid balance.

- [ ] Research and document x402 protocol flow
- [ ] Implement x402 payment header parsing
- [ ] Implement payment authorization (check ceiling)
- [ ] Implement payment settlement (charge actual cost)
- [ ] USDC on Base integration
- [ ] Payment receipt generation
- [ ] Failed payment handling
- [ ] Refund mechanism for failed requests
- [ ] Payment verification endpoint
- [ ] Integration with budget system
- [ ] Unit tests for payment flow
- [ ] Test payment races and double-spend prevention
- [ ] Test bypass attempts (requests without valid payment)

**Definition of Done:** Agents pay per call in USDC, settlement is accurate, no bypass possible.

---

## Phase 5: MCP Server Integration

**Goal:** Model Context Protocol server at `mcp.repogen.xyz`.

- [ ] Set up MCP server in `apps/mcp`
- [ ] Implement MCP tool definitions for inference
- [ ] Implement MCP resource definitions
- [ ] Authentication via Bearer token
- [ ] Route MCP calls through same inference pipeline
- [ ] Budget enforcement on MCP path
- [ ] x402 payment on MCP path
- [ ] No-log verification on MCP path
- [ ] MCP streaming support
- [ ] Integration tests with MCP client
- [ ] Test with Claude Code MCP config

**Definition of Done:** MCP server works with Claude Code, budgets enforced, payments work, no logs.

---

## Phase 6: Privacy Tiers

**Goal:** Standard, No-log, and TEE-only privacy levels.

- [ ] Define privacy tier enum and request parameter
- [ ] Standard tier: token count only, provider follows own policy
- [ ] No-log tier: route only to providers that store nothing
- [ ] TEE tier: route only to sealed enclave providers (Phala, etc.)
- [ ] Implement no-log provider verification
- [ ] Implement TEE attestation verification
- [ ] Privacy tier validation middleware
- [ ] Audit logging (metadata only, never content)
- [ ] Unit tests for tier routing
- [ ] Verification tests: confirm no prompt/response logged
- [ ] TEE attestation verification tests

**Definition of Done:** Privacy tiers work, no-log verified on HTTP and MCP paths, TEE attestation valid.

---

## Phase 7: Abuse Protection & Rate Limiting

**Goal:** Baseline abuse protection without compromising privacy.

- [ ] Set up Redis for rate limiting
- [ ] Implement rate limiting middleware (per API key)
- [ ] Implement global rate limiting (prevent DDoS)
- [ ] Request size limits
- [ ] Response size limits
- [ ] Timeout handling
- [ ] Suspicious pattern detection (without logging content)
- [ ] API key revocation mechanism
- [ ] Abuse reporting endpoint
- [ ] Rate limit headers in responses
- [ ] Tests for rate limiting
- [ ] Load tests for abuse scenarios

**Definition of Done:** Abuse baseline enforced, rate limits work, no content logged during abuse detection.

---

## Phase 8: Landing Page & Web App

**Goal:** Marketing site + dashboard following design system.

Design tokens:
- `--bg: #050507; --bg-elev: #0c0c12; --border: rgba(255,255,255,0.08)`
- `--text: #EDEDF2; --text-dim: #9A9AA8`
- Aurora: `blue #2536FF, violet #6A3CFF, magenta #C44BD6, cyan #4FD1E0, green #8FCF9A`

- [ ] Set up Next.js app in `apps/web`
- [ ] Implement design system tokens and components
- [ ] Hero section with aurora gradient ribbons
- [ ] "Point your agent at repogen" code example section
- [ ] "Why agents run on repogen" feature cards
- [ ] "One endpoint, every model" section
- [ ] Footer with links
- [ ] Dashboard: API key management
- [ ] Dashboard: Usage metrics
- [ ] Dashboard: Budget configuration
- [ ] Responsive design
- [ ] Film grain overlay effect
- [ ] Geist/Inter fonts, Geist Mono/JetBrains Mono for code

**Definition of Done:** Landing page matches design spec, dashboard functional, responsive.

---

## Phase 9: Documentation

**Goal:** Complete docs for API, MCP, x402, privacy, and quickstart.

- [ ] OpenAI-compatible API reference
- [ ] MCP integration guide
- [ ] Agent quickstart (under 5 minutes)
- [ ] x402 payment reference
- [ ] Privacy tier guarantees documentation
- [ ] `/llms.txt` for AI agent discovery
- [ ] SDK examples (Python, Node.js, cURL)
- [ ] Troubleshooting guide
- [ ] Rate limits and quotas documentation
- [ ] Changelog

**Definition of Done:** All docs complete, quickstart works in under 5 minutes, llms.txt served.

---

## Phase 10: Docker Deployment

**Goal:** One-command deploy with Docker Compose.

- [ ] Dockerfile for API
- [ ] Dockerfile for MCP server
- [ ] Dockerfile for Web app
- [ ] Docker Compose with all services
- [ ] Postgres container with migrations
- [ ] Redis container
- [ ] Nginx/Caddy reverse proxy
- [ ] SSL/TLS configuration
- [ ] Environment variable documentation
- [ ] Health check configuration
- [ ] Logging configuration (no content, only metadata)
- [ ] One-command deploy script
- [ ] Deploy to staging environment
- [ ] Deploy verification tests

**Definition of Done:** `docker compose up` starts entire stack, SSL works, health checks pass.

---

## Phase 11: Security Audit & Testing

**Goal:** Verify all security properties before beta.

- [ ] Budget bypass penetration testing
- [ ] x402 payment bypass testing
- [ ] Race condition testing (concurrent budget deductions)
- [ ] No-log verification audit (HTTP path)
- [ ] No-log verification audit (MCP path)
- [ ] API key security review
- [ ] Input validation review
- [ ] Dependency vulnerability scan
- [ ] Load testing (1000 concurrent requests)
- [ ] Chaos testing (provider failures)
- [ ] Security findings remediation

**Definition of Done:** All bypass attempts fail, no-log verified, load tests pass, no critical vulnerabilities.

---

## Phase 12: Private Beta Launch

**Goal:** Deploy to production, onboard beta users.

- [ ] Production environment setup
- [ ] DNS configuration (api.repogen.xyz, mcp.repogen.xyz, repogen.xyz)
- [ ] Production secrets management
- [ ] Monitoring and alerting setup
- [ ] Error tracking (Sentry or similar)
- [ ] Backup configuration
- [ ] Beta user onboarding flow
- [ ] Feedback collection mechanism
- [ ] Launch checklist verification
- [ ] Go live

**Definition of Done:** Deployed, documented, abuse baseline enforced, no-log verified, budgets and x402 un-bypassable, ready for private beta.

---

## Current Status

**Active Phase:** Phase 2 - Provider Routing & Multi-Model Support

**Last Updated:** 2026-06-19

---

## Commit History

| Phase | Commit | Date | Notes |
|-------|--------|------|-------|
| 0 | bbbf24f | 2026-06-19 | Project setup complete |
| 1 | pending | 2026-06-19 | Core API with streaming, 15 tests passing |

---

## Notes

- Budget system and x402 settlement are highest-risk. Test concurrency, races, and bypass attempts hardest.
- Re-verify no-log property on both HTTP and MCP paths whenever touching request path.
- Keep secrets in env, never in code.
- Card sections on landing page are black and white, no colored borders. Aurora reserved for hero and glow accents.
