# Contributing to repogen

Thank you for your interest in contributing to repogen! We're building the decentralized inference layer for autonomous AI, and we welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Priority Areas](#priority-areas)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive
- Welcome newcomers
- Focus on the work, not the person
- Accept feedback gracefully

---

## How to Contribute

### Report Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Suggest Features

1. Open a GitHub Discussion
2. Describe the use case
3. Explain why it benefits the project

### Submit Code

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.10+ (for Petals gateway)
- Docker (optional)
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/repogen.git
cd repogen

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development servers
pnpm dev
```

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @repogen/api test

# Watch mode
pnpm --filter @repogen/api test:watch
```

### Services

| Service | Port | URL |
|---------|------|-----|
| API | 3001 | http://localhost:3001 |
| MCP | 3002 | http://localhost:3002 |
| Web | 3000 | http://localhost:3000 |

---

## Project Structure

```
repogen/
├── apps/
│   ├── api/              # OpenAI-compatible inference API
│   │   ├── src/
│   │   │   ├── routes/   # HTTP endpoints
│   │   │   ├── auth/     # Authentication
│   │   │   ├── budget/   # Budget enforcement
│   │   │   └── ...
│   │   └── package.json
│   ├── web/              # Dashboard & landing page
│   ├── petals-gateway/   # Bridge to decentralized network
│   └── mcp/              # MCP server
├── packages/
│   ├── node/             # GPU contributor CLI
│   ├── sdk/              # TypeScript/Python SDK
│   ├── contracts/        # Smart contracts (Solidity)
│   └── shared/           # Shared types & utilities
├── docs/                 # Documentation
└── scripts/              # Deployment & utilities
```

---

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over callbacks
- Document public APIs with JSDoc

```typescript
/**
 * Validates an API key format.
 * @param key - The API key to validate
 * @returns true if valid, false otherwise
 */
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith('rg_') && key.length >= 40
}
```

### Formatting

We use Prettier and ESLint:

```bash
# Format code
pnpm format

# Lint code
pnpm lint
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add wallet connection
fix: handle rate limit edge case
docs: update API reference
refactor: simplify budget service
test: add concurrent request tests
```

### Branch Naming

```
feature/wallet-auth
fix/budget-overflow
docs/api-reference
refactor/router-logic
```

---

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] New code has tests
- [ ] Documentation updated
- [ ] Commit messages follow convention

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
How did you test this?

## Checklist
- [ ] Tests pass
- [ ] Docs updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks run (lint, test, build)
2. Maintainer reviews code
3. Address feedback
4. Maintainer approves and merges

---

## Priority Areas

We especially welcome contributions in:

### High Priority

| Area | Description |
|------|-------------|
| **Petals optimization** | Improve inference speed and reliability |
| **Smart routing** | Better node selection algorithms |
| **SDK languages** | Python, Go, Rust SDKs |
| **Documentation** | Guides, tutorials, API docs |

### Medium Priority

| Area | Description |
|------|-------------|
| **Testing** | Increase test coverage |
| **Monitoring** | Better observability |
| **Security** | Audit, hardening |
| **UI/UX** | Dashboard improvements |

### Good First Issues

Look for issues labeled `good first issue`:
- Documentation fixes
- Typo corrections
- Small bug fixes
- Test additions

---

## Getting Help

- **Discord**: [discord.gg/repogen](https://discord.gg/repogen)
- **GitHub Discussions**: Ask questions
- **Issues**: Report bugs

---

## Recognition

Contributors are:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Part of building open AI infrastructure

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping build the decentralized future of AI!
