# Technical Decisions

## SQLite over PostgreSQL

**Decision**: Reverted from PostgreSQL to SQLite (better-sqlite3).

**Why**: ClaudeDeck is single-user per instance — each instance reads `~/.claude/` from one system user. PostgreSQL adds unnecessary complexity (separate server, connection management, deployment overhead). SQLite with WAL mode is zero-config, stores at `~/.claude-deck/data.db`, and is portable.

**Trade-off**: No concurrent write scaling, but irrelevant for single-user.

## Claude JSONL as Primary Session Source

**Decision**: Sessions come from `~/.claude/projects/` JSONL files, not from the SQLite database.

**Why**: Claude Code already creates and manages session data in JSONL files. Duplicating this in a database creates sync issues. The JSONL files are the source of truth.

**What SQLite still handles**: Projects (claude-deck managed), groups, dev servers, worktrees, hidden items. These are claude-deck features that don't exist in Claude's data model.

## tmux for Session Persistence

**Decision**: Claude Code runs inside tmux sessions, not direct PTY processes.

**Why**: tmux sessions survive browser disconnects. Users can close the browser, come back later, and reconnect to running Claude sessions. Without tmux, the Claude process would die when the WebSocket disconnects.

**Trade-off**: tmux adds complexity to scroll handling (see troubleshooting.md). The alternative (direct PTY with session caching like cloudcli-ui) would be simpler but loses true persistence.

## tmux mouse on (Required)

**Decision**: tmux must have `set -g mouse on` for scroll to work.

**Why**: Without mouse mode, xterm.js converts wheel events to arrow key escape sequences in the alternate screen buffer. With mouse mode, tmux receives proper mouse wheel events and enters copy-mode for scrolling.

**Critical**: `~/.tmux.conf` must contain `set -g mouse on`. The setup script creates this, but if the file is deleted, scroll breaks. See troubleshooting.md.

## No Multi-user Auth

**Decision**: No authentication system. Each instance is single-user.

**Why**: The app reads `~/.claude/` which is per-system-user. Multi-user would require running as root or complex permission management. Each user should run their own instance.

**Future**: A simple PIN/password via env var may be added to prevent unauthorized network access.

## Claude-Only Provider

**Decision**: Removed OpenCode provider, kept only Claude Code.

**Why**: The project is specifically a Claude Code session manager. Supporting multiple providers added complexity without clear value. The provider abstraction is still in place if needed later.

## PWA with Network-First Strategy

**Decision**: Service worker uses network-first caching.

**Why**: The app needs real-time data (sessions, terminal). Aggressive caching would show stale data. Only `/_next/static/` assets are cache-first (they have content hashes). Navigation requests always go to network with offline fallback.

## VS Code Remote Button

**Decision**: Button generates `vscode://` URI instead of running code-server.

**Why**: Zero server-side dependencies. If the user has VS Code + Remote SSH extension, it works immediately. The URI includes the SSH user (from `/api/system`) and the session's working directory.

### Message History — kept as dormant infrastructure (April 2025)

The backend is complete: `getSessionMessages()` reads JSONL, the `/api/sessions/[id]/messages` endpoint returns paginated messages, and `ChatView`/`ChatMessage` components can render them. However, no React Query hook consumes the endpoint and no tab in the UI displays the view. The feature was never connected to the frontend.

**Decision:** keep the infrastructure. The backend reads Claude's native JSONL format (no custom storage), the API is correct, and the components are functional. Connecting them requires only a query hook and a tab in the Pane component. Removing them would save nothing meaningful and require rebuilding from scratch later.

**Files:** `src/lib/claude/jsonl-reader.ts` (getSessionMessages), `src/app/api/sessions/[id]/messages/route.ts`, `src/components/ChatView.tsx`, `src/components/ChatMessage.tsx`
