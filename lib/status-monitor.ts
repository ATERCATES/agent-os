/**
 * Session status monitor — hook-based detection.
 *
 * Claude Code hooks write state files to ~/.claude-deck/session-states/.
 * This module reads those files and pushes updates to the frontend via WebSocket.
 *
 * The only periodic work is `tmux list-sessions` every 3s to detect dead sessions.
 * All state transitions are event-driven via Chokidar watching the state files dir.
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import {
  getManagedSessionPattern,
  getSessionIdFromName,
  getProviderIdFromSessionName,
} from "./providers/registry";
import type { AgentType } from "./providers";
import { broadcast } from "./claude/watcher";
import { getDb } from "./db";
import { STATES_DIR } from "./hooks/setup";
import { getSessionInfo } from "@anthropic-ai/claude-agent-sdk";

const execAsync = promisify(exec);

const TICK_INTERVAL_MS = 3000;
const SESSION_NAME_CACHE_TTL = 10_000;
const UUID_PATTERN = getManagedSessionPattern();

// Cache for session display names (summary from SDK)
const sessionNameCache = new Map<string, { name: string; cachedAt: number }>();

// --- Types ---

export type SessionStatus = "running" | "waiting" | "idle" | "dead";

interface StateFile {
  status: "running" | "waiting" | "idle";
  lastLine: string;
  waitingContext?: string;
  ts: number;
}

export interface SessionStatusSnapshot {
  sessionName: string;
  status: SessionStatus;
  lastLine: string;
  waitingContext?: string;
  claudeSessionId: string | null;
  agentType: AgentType;
}

// --- State ---

let currentSnapshot: Record<string, SessionStatusSnapshot> = {};
let monitorTimer: ReturnType<typeof setInterval> | null = null;

// --- State file reading ---

function readStateFile(sessionId: string): StateFile | null {
  try {
    const filePath = path.join(STATES_DIR, `${sessionId}.json`);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function listStateFiles(): Map<string, StateFile> {
  const map = new Map<string, StateFile>();
  try {
    for (const file of fs.readdirSync(STATES_DIR)) {
      if (!file.endsWith(".json")) continue;
      const sessionId = file.replace(".json", "");
      const state = readStateFile(sessionId);
      if (state) map.set(sessionId, state);
    }
  } catch {
    // dir may not exist yet
  }
  return map;
}

// --- tmux ---

async function listTmuxSessions(): Promise<Map<string, string>> {
  // Returns Map<sessionId, sessionName>
  try {
    const { stdout } = await execAsync(
      "tmux list-sessions -F '#{session_name}' 2>/dev/null || echo \"\""
    );
    const map = new Map<string, string>();
    for (const name of stdout.trim().split("\n")) {
      if (!name || !UUID_PATTERN.test(name)) continue;
      map.set(getSessionIdFromName(name), name);
    }
    return map;
  } catch {
    return new Map();
  }
}

// --- Session display name resolution ---

async function resolveSessionDisplayName(sessionId: string): Promise<string> {
  const cached = sessionNameCache.get(sessionId);
  if (cached && Date.now() - cached.cachedAt < SESSION_NAME_CACHE_TTL) {
    return cached.name;
  }

  try {
    const info = await getSessionInfo(sessionId);
    if (info) {
      const name = info.customTitle || info.summary || sessionId.slice(0, 8);
      sessionNameCache.set(sessionId, { name, cachedAt: Date.now() });
      return name;
    }
  } catch {
    // SDK lookup failed — use short ID
  }

  const fallback = sessionId.slice(0, 8);
  sessionNameCache.set(sessionId, { name: fallback, cachedAt: Date.now() });
  return fallback;
}

// --- Snapshot building ---

async function buildSnapshot(
  tmuxSessions: Map<string, string>,
  stateFiles: Map<string, StateFile>
): Promise<Record<string, SessionStatusSnapshot>> {
  const snap: Record<string, SessionStatusSnapshot> = {};

  const entries = await Promise.all(
    [...tmuxSessions.entries()].map(async ([sessionId, tmuxName]) => {
      const displayName = await resolveSessionDisplayName(sessionId);
      return { sessionId, tmuxName, displayName };
    })
  );

  for (const { sessionId, tmuxName, displayName } of entries) {
    const agentType = getProviderIdFromSessionName(tmuxName) || "claude";
    const state = stateFiles.get(sessionId);

    snap[sessionId] = {
      sessionName: displayName,
      status: state?.status || "idle",
      lastLine: state?.lastLine || "",
      ...(state?.status === "waiting" && state.waitingContext
        ? { waitingContext: state.waitingContext }
        : {}),
      claudeSessionId: sessionId,
      agentType,
    };
  }

  return snap;
}

function snapshotChanged(
  prev: Record<string, SessionStatusSnapshot>,
  next: Record<string, SessionStatusSnapshot>
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return true;
  for (const id of nextKeys) {
    const p = prev[id];
    const n = next[id];
    if (
      !p ||
      p.status !== n.status ||
      p.lastLine !== n.lastLine ||
      p.sessionName !== n.sessionName
    )
      return true;
  }
  return false;
}

function updateDb(
  prev: Record<string, SessionStatusSnapshot>,
  next: Record<string, SessionStatusSnapshot>
): void {
  try {
    const db = getDb();
    for (const [id, snap] of Object.entries(next)) {
      if (prev[id]?.status === snap.status) continue;
      db.prepare(
        "UPDATE sessions SET updated_at = datetime('now') WHERE id = ?"
      ).run(id);
      if (snap.claudeSessionId) {
        db.prepare(
          "UPDATE sessions SET claude_session_id = ? WHERE id = ? AND (claude_session_id IS NULL OR claude_session_id != ?)"
        ).run(snap.claudeSessionId, id, snap.claudeSessionId);
      }
    }
  } catch {
    // DB errors shouldn't break the monitor
  }
}

// --- Core tick (only for dead detection + state file sync) ---

async function tick(): Promise<void> {
  const tmuxSessions = await listTmuxSessions();
  const stateFiles = listStateFiles();

  // Clean up state files for sessions that no longer exist in tmux
  for (const sessionId of stateFiles.keys()) {
    if (!tmuxSessions.has(sessionId)) {
      try {
        fs.unlinkSync(path.join(STATES_DIR, `${sessionId}.json`));
      } catch {
        // ignore
      }
    }
  }

  const newSnapshot = await buildSnapshot(tmuxSessions, stateFiles);

  if (snapshotChanged(currentSnapshot, newSnapshot)) {
    updateDb(currentSnapshot, newSnapshot);
    currentSnapshot = newSnapshot;
    broadcast({ type: "session-statuses", statuses: newSnapshot });
  }
}

// --- Public API ---

export function getStatusSnapshot(): Record<string, SessionStatusSnapshot> {
  return currentSnapshot;
}

export function acknowledge(_sessionName: string): void {
  // With hook-based detection, acknowledge is a no-op.
  // Status is determined by Claude Code's hook events, not by us.
}

/**
 * Called by Chokidar when a state file in ~/.claude-deck/session-states/ changes.
 * Triggers an immediate re-read and broadcast.
 */
export function onStateFileChange(): void {
  tick().catch(console.error);
}

export function startStatusMonitor(): void {
  if (monitorTimer) return;

  // Ensure states directory exists
  fs.mkdirSync(STATES_DIR, { recursive: true });

  // Initial tick
  setTimeout(() => tick().catch(console.error), 500);

  // Periodic fallback (catches tmux session death, missed events)
  monitorTimer = setInterval(() => {
    tick().catch(console.error);
  }, TICK_INTERVAL_MS);

  console.log("> Status monitor started (hook-based, 3s fallback tick)");
}

export function stopStatusMonitor(): void {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
}
