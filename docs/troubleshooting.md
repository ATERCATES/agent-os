# Troubleshooting

## Terminal Scroll Sends Arrow Keys Instead of Scrolling

**Symptom**: Mouse wheel or touch scroll in the terminal sends up/down arrow keys to Claude Code instead of scrolling through output.

**Cause**: tmux `mouse` option is `off`. Without it, xterm.js converts wheel events to arrow key escape sequences in alternate screen buffer.

**Fix**:

```bash
# Check current setting
tmux show -g mouse

# Fix immediately
tmux set -g mouse on

# Make permanent
echo 'set -g mouse on' >> ~/.tmux.conf
```

**Why it happens**: tmux global settings only persist while the tmux server is running. If all tmux sessions are killed or the server restarts, settings reset to defaults. The `~/.tmux.conf` file ensures `mouse on` is always set at startup.

**Prevention**: Run `scripts/setup.sh` which creates `~/.tmux.conf` with the correct settings.

## Session Resume Shows [exited]

**Symptom**: Clicking a session in the sidebar shows `[exited]` in the terminal.

**Causes**:

1. **Empty session**: The session only has metadata (custom-title, agent-name) but no conversation messages. `claude --resume {id}` fails with "No conversation found" and exits immediately.
   - **Fix**: The app falls back to `claude --continue` automatically. Sessions with ≤2 entries are filtered from the listing.

2. **Wrong cwd**: The resume command runs in the wrong directory. Claude can't find the session.
   - **Fix**: The API uses the project's directory from the cache as fallback when the session's JSONL has no `cwd` field.

3. **Stale tmux session**: A previous tmux session with the same name exists but is dead.
   - **Fix**: The resume command always kills the old session first: `tmux kill-session -t {name} 2>/dev/null; tmux new ...`

## "Not a git repository" in Git Panel

**Symptom**: The git panel shows "Not a git repository" for a project that has `.git`.

**Cause**: The session's `working_directory` is `"~"` (home) instead of the actual project directory. This happens when the session was created before the cwd propagation fix.

**Fix**: Select the session again from the sidebar. New sessions propagate the correct `cwd` from the JSONL data through the `TabData.workingDirectory` field.

## crypto.randomUUID is not a function

**Symptom**: Error when creating a new session via the + button.

**Cause**: `crypto.randomUUID()` is only available in secure contexts (HTTPS or localhost). When accessing from a network IP over HTTP, it's not available.

**Fix**: The app uses `Math.random().toString(36) + Date.now().toString(36)` instead.

## WebSocket Disconnects on Mobile

**Symptom**: Terminal disconnects when switching apps or locking the phone.

**How it recovers**:

1. Server-side heartbeat pings every 30s, kills connections with no pong in 10s
2. Client detects page visibility change — if hidden >5s, force reconnects
3. Client reconnects with exponential backoff (1s to 30s max)
4. Inactivity timeout: if no data received in 45s, force reconnect

## Docker: tmux not working

**Symptom**: Sessions created inside Docker don't persist or scroll doesn't work.

**Fix**: The Dockerfile creates `/root/.tmux.conf` with `mouse on`. Ensure the container has tmux installed (`apk add tmux` in Alpine).

## Claude JSONL Project Name Encoding

The directory names in `~/.claude/projects/` are encoded paths where `/` becomes `-`. Example:

- Path: `/home/atercates/Projects/Dribo/bitbucket-mcp`
- Encoded: `-home-atercates-Projects-Dribo-bitbucket-mcp`

**Important**: This encoding is NOT reversible by simple dash-to-slash replacement because directory names can contain dashes (e.g., `bitbucket-mcp`). The actual directory is extracted from the JSONL `cwd` field, not by decoding the name.

## Port Conflicts

**Default port**: 3011. Change via:

- Environment variable: `PORT=3012`
- CLI flag: `pnpm dev -- -p 3012`
- `.env` file: `PORT=3012`

## Dev Server from Network IP (allowedDevOrigins)

**Symptom**: `Blocked cross-origin request to Next.js dev resource` when accessing from phone/tablet.

**Fix**: Add your IP to `next.config.ts`:

```typescript
allowedDevOrigins: ["192.168.1.138"],
```
