# Architecture

## Overview

ClaudeDeck is a web-based Claude Code session manager. It reads session data from `~/.claude/projects/` JSONL files and provides a terminal UI (xterm.js) to interact with Claude Code via tmux.

## Stack

- **Frontend**: Next.js 16 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Custom server (`server.ts`) with Next.js + WebSocket (ws) + node-pty
- **Database**: SQLite (better-sqlite3) at `~/.claude-deck/data.db` — used for projects, groups, dev servers, hidden items
- **Terminal**: xterm.js v6 with CanvasAddon, FitAddon, SearchAddon, WebLinksAddon
- **Session persistence**: tmux — sessions survive browser disconnects
- **Package manager**: pnpm

## Data Sources

### Claude JSONL Sessions (Primary)

- Location: `~/.claude/projects/{encoded-project-name}/*.jsonl`
- Read-only — created by Claude Code CLI
- Contains: sessionId, messages, cwd, customTitle, timestamps
- Parsed by `lib/claude/jsonl-reader.ts`, cached by `lib/claude/jsonl-cache.ts`
- Real-time updates via Chokidar file watcher → WebSocket broadcast

### SQLite Database (Secondary)

- Location: `~/.claude-deck/data.db`
- Used for: claude-deck projects, groups, dev servers, worktrees, hidden items
- NOT used for session listing (sessions come from JSONL)
- Schema: `lib/db/schema.ts`, queries: `lib/db/queries.ts`

## WebSocket Endpoints

| Endpoint       | Purpose                   | Protocol                                      |
| -------------- | ------------------------- | --------------------------------------------- |
| `/ws/terminal` | PTY I/O for xterm.js      | JSON messages: input, output, resize, command |
| `/ws/updates`  | Real-time sidebar updates | JSON: project-updated, projects-changed       |

Both endpoints have server-side ping/pong heartbeat (30s interval, 10s timeout).

## Terminal → Claude Code Flow

```
Browser (xterm.js)
    ↕ WebSocket /ws/terminal
Server (node-pty spawns shell)
    ↕ PTY
Shell executes: tmux attach/new -s claude-{id} -c "{cwd}" "claude --resume {id}"
    ↕ tmux session
Claude Code (interactive TUI)
```

## Session Resume Flow

1. User clicks session in sidebar → `resumeClaudeSession(sessionId, cwd, name, project)`
2. Kills any existing tmux session with that name
3. Creates new tmux session: `tmux new -s claude-{id} -c "{cwd}" "claude --resume {id} || claude --continue"`
4. Fallback to `--continue` handles sessions without conversation history
5. Terminal attaches via `attachSession()` in PaneContext

## Key Directories

```
app/                    Next.js pages and API routes
app/api/claude/         Claude JSONL session APIs
app/api/sessions/       DB session APIs (legacy, still active)
app/api/git/            Git operations
app/api/system/         System info (user, hostname)
components/
  ClaudeProjects/       Sidebar: project cards, session cards
  Pane/                 Terminal pane: tab bars, VS Code button
  Terminal/             xterm.js terminal component
    hooks/              Connection, touch-scroll, resize, terminal-init
  NewClaudeSessionDialog.tsx  New session name dialog
  QuickSwitcher.tsx     Cmd+K session/code search
contexts/PaneContext.tsx  Multi-pane state management
lib/
  claude/               JSONL reader, cache, file watcher
  db/                   SQLite schema, queries, migrations
  providers/            Provider registry (Claude only)
  panes.ts              Pane/tab data types
server.ts               Main server: HTTP + WebSocket + PTY
scripts/
  setup.sh              Development setup
  claude-deck              CLI for install/start/stop
```
