# CLAUDE.md — ClaudeDeck

Web-based Claude Code session manager. React + Next.js + xterm.js + tmux.

## Quick Reference

```bash
pnpm dev          # Development (port 3011)
pnpm build        # Production build
pnpm start        # Production server
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
```

## Documentation

Comprehensive technical docs are in `docs/`:

- **`docs/architecture.md`** — System overview, data sources, terminal flow, directory structure
- **`docs/decisions.md`** — Why SQLite over PostgreSQL, why tmux, why JSONL as primary source, etc.
- **`docs/troubleshooting.md`** — Common issues: scroll not working, [exited] on resume, crypto errors, etc.
- **`docs/setup.md`** — Requirements, environment variables, Docker, PWA, production deployment

**Read these before making changes** — they explain constraints and past decisions that aren't obvious from the code alone.

## Key Architecture Points

- **Sessions come from JSONL** (`~/.claude/projects/`), NOT from the SQLite database
- **tmux is required** with `mouse on` in `~/.tmux.conf` — without it, terminal scroll breaks
- **SQLite** is used for claude-deck features (projects, groups, dev servers) not for sessions
- **Single-user per instance** — no auth, each user runs their own instance
- **Provider: Claude only** — OpenCode was removed, provider abstraction remains if needed

## Project Structure

All source code lives under `src/`. Root contains only config files and entry points.

- `src/app/` — Next.js pages and API routes
- `src/components/` — React components (feature-based subdirs)
- `src/lib/` — Server-side logic, DB, auth, providers, Claude integration
- `src/data/` — React Query keys and hooks (client-side data layer)
- `src/hooks/` — Shared React hooks
- `src/stores/` — Zustand stores
- `src/contexts/` — React contexts
- `src/styles/` — Theme CSS
- `src/mcp/` — MCP server definitions
- `server.ts` — Custom Node.js server (root entry point)

## Conventions

- Package manager: **pnpm**
- TypeScript strict mode
- ESLint v10 flat config + Prettier with Tailwind plugin
- Conventional commits (commitlint + Husky)
- No comments in code unless logic is non-obvious
- Pre-commit: lint-staged (formatting + typecheck)
- Path alias: `@/` resolves to `src/`

## Common Pitfalls

1. **tmux mouse off** → scroll sends arrow keys. Fix: `tmux set -g mouse on` and ensure `~/.tmux.conf` exists
2. **JSONL cwd can be null** → fallback to project directory, never to `$HOME` blindly
3. **Project name encoding** has dashes in dir names (e.g., `bitbucket-mcp`) — cannot decode by simple replace
4. **`crypto.randomUUID()`** doesn't work over HTTP from network IPs — use Math.random fallback
5. **Empty sessions** (only metadata, no messages) → `claude --resume` fails, use `--continue` as fallback
