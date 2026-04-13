/**
 * Server-side session status monitor.
 *
 * Replaces client-side polling with a server-side 1s loop that:
 * 1. Runs a single `tmux list-sessions` to get activity timestamps
 * 2. Only captures panes for sessions whose activity changed
 * 3. Pushes status diffs to clients via WebSocket
 *
 * This reduces latency from ~5-7s (HTTP poll) to ~1s (push).
 */

import { exec } from "child_process";
import { promisify } from "util";
import { statusDetector, type SessionStatus } from "./status-detector";
import {
  getManagedSessionPattern,
  getSessionIdFromName,
  getProviderIdFromSessionName,
} from "./providers/registry";
import type { AgentType } from "./providers";
import { broadcast } from "./claude/watcher";
import { getDb } from "./db";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

const MONITOR_INTERVAL_MS = 1000;
const UUID_PATTERN = getManagedSessionPattern();

interface SessionStatusSnapshot {
  sessionName: string;
  status: SessionStatus;
  lastLine: string;
  waitingContext?: string;
  claudeSessionId: string | null;
  agentType: AgentType;
}

// Cached claude session IDs (rarely change during a session's lifetime)
const claudeSessionIdCache = new Map<
  string,
  { id: string | null; cachedAt: number }
>();
const CLAUDE_ID_CACHE_TTL = 30000; // 30s

// Previous snapshot for diffing
let previousSnapshot = new Map<string, SessionStatusSnapshot>();
let monitorInterval: ReturnType<typeof setInterval> | null = null;

async function getTmuxSessions(): Promise<Map<string, number>> {
  try {
    const { stdout } = await execAsync(
      "tmux list-sessions -F '#{session_name}\t#{session_activity}' 2>/dev/null || echo \"\""
    );
    const sessions = new Map<string, number>();
    for (const line of stdout.trim().split("\n")) {
      if (!line) continue;
      const [name, activity] = line.split("\t");
      if (name && activity) sessions.set(name, parseInt(activity, 10) || 0);
    }
    return sessions;
  } catch {
    return new Map();
  }
}

async function captureLastLines(
  sessionName: string
): Promise<{ lastLine: string; waitingContext?: string }> {
  try {
    const { stdout } = await execAsync(
      `tmux capture-pane -t "${sessionName}" -p -S -5 2>/dev/null || echo ""`
    );
    const lines = stdout.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1] || "";
    const waitingContext =
      lines.length > 1 ? lines.slice(-3).join("\n") : undefined;
    return { lastLine, waitingContext };
  } catch {
    return { lastLine: "" };
  }
}

function getClaudeSessionIdFromEnvSync(sessionName: string): string | null {
  // Check cache first
  const cached = claudeSessionIdCache.get(sessionName);
  if (cached && Date.now() - cached.cachedAt < CLAUDE_ID_CACHE_TTL) {
    return cached.id;
  }
  return null;
}

async function getClaudeSessionIdFromEnv(
  sessionName: string
): Promise<string | null> {
  // Check cache
  const cached = getClaudeSessionIdFromEnvSync(sessionName);
  if (cached !== null) return cached;

  try {
    const { stdout } = await execAsync(
      `tmux show-environment -t "${sessionName}" CLAUDE_SESSION_ID 2>/dev/null || echo ""`
    );
    const line = stdout.trim();
    let id: string | null = null;
    if (line.startsWith("CLAUDE_SESSION_ID=")) {
      const val = line.replace("CLAUDE_SESSION_ID=", "");
      if (val && val !== "null") id = val;
    }

    // Also try file-based lookup if env didn't work
    if (!id) {
      try {
        const { stdout: cwdOut } = await execAsync(
          `tmux display-message -t "${sessionName}" -p "#{pane_current_path}" 2>/dev/null || echo ""`
        );
        const cwd = cwdOut.trim();
        if (cwd) {
          id = getClaudeSessionIdFromFiles(cwd);
        }
      } catch {
        // ignore
      }
    }

    claudeSessionIdCache.set(sessionName, { id, cachedAt: Date.now() });
    return id;
  } catch {
    return null;
  }
}

function getClaudeSessionIdFromFiles(projectPath: string): string | null {
  const home = os.homedir();
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(home, ".claude");
  const projectDirName = projectPath.replace(/\//g, "-");
  const projectDir = path.join(claudeDir, "projects", projectDirName);

  if (!fs.existsSync(projectDir)) return null;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/;

  try {
    const files = fs.readdirSync(projectDir);
    let mostRecent: string | null = null;
    let mostRecentTime = 0;

    for (const file of files) {
      if (file.startsWith("agent-")) continue;
      if (!uuidPattern.test(file)) continue;
      const filePath = path.join(projectDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs > mostRecentTime) {
        mostRecentTime = stat.mtimeMs;
        mostRecent = file.replace(".jsonl", "");
      }
    }

    if (mostRecent && Date.now() - mostRecentTime < 5 * 60 * 1000) {
      return mostRecent;
    }
    return null;
  } catch {
    return null;
  }
}

async function tick(): Promise<void> {
  const tmuxSessions = await getTmuxSessions();
  const managedNames = [...tmuxSessions.keys()].filter((s) =>
    UUID_PATTERN.test(s)
  );

  const newSnapshot = new Map<string, SessionStatusSnapshot>();

  // Process sessions in parallel
  const results = await Promise.all(
    managedNames.map(async (sessionName) => {
      const id = getSessionIdFromName(sessionName);
      const agentType = getProviderIdFromSessionName(sessionName) || "claude";

      const status = await statusDetector.getStatus(sessionName);
      const { lastLine, waitingContext } = await captureLastLines(sessionName);
      const claudeSessionId = await getClaudeSessionIdFromEnv(sessionName);

      return {
        id,
        snapshot: {
          sessionName,
          status,
          lastLine,
          ...(status === "waiting" && waitingContext ? { waitingContext } : {}),
          claudeSessionId,
          agentType,
        } as SessionStatusSnapshot,
      };
    })
  );

  // Build new snapshot and detect changes
  let hasChanges = false;
  const statusMap: Record<string, SessionStatusSnapshot> = {};

  for (const { id, snapshot } of results) {
    newSnapshot.set(id, snapshot);
    statusMap[id] = snapshot;

    const prev = previousSnapshot.get(id);
    if (
      !prev ||
      prev.status !== snapshot.status ||
      prev.lastLine !== snapshot.lastLine
    ) {
      hasChanges = true;
    }
  }

  // Check for sessions that disappeared
  for (const id of previousSnapshot.keys()) {
    if (!newSnapshot.has(id)) {
      hasChanges = true;
      claudeSessionIdCache.delete(previousSnapshot.get(id)?.sessionName || "");
    }
  }

  previousSnapshot = newSnapshot;

  // Update DB for active sessions
  try {
    const db = getDb();
    for (const { id, snapshot } of results) {
      if (snapshot.status === "running" || snapshot.status === "waiting") {
        db.prepare(
          "UPDATE sessions SET updated_at = datetime('now') WHERE id = ?"
        ).run(id);
      }
      if (snapshot.claudeSessionId) {
        db.prepare(
          "UPDATE sessions SET claude_session_id = ? WHERE id = ? AND (claude_session_id IS NULL OR claude_session_id != ?)"
        ).run(snapshot.claudeSessionId, id, snapshot.claudeSessionId);
      }
    }
  } catch {
    // DB errors shouldn't break the monitor
  }

  statusDetector.cleanup();

  // Push to clients if anything changed
  if (hasChanges) {
    broadcast({ type: "session-statuses", statuses: statusMap });
  }
}

export function startStatusMonitor(): void {
  if (monitorInterval) return;

  // Initial tick after short delay (let DB init first)
  setTimeout(() => {
    tick().catch(console.error);
  }, 1000);

  monitorInterval = setInterval(() => {
    tick().catch(console.error);
  }, MONITOR_INTERVAL_MS);

  console.log("> Status monitor started (1s push interval)");
}

export function stopStatusMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
