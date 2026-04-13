#!/usr/bin/env node
/**
 * Claude Code hook reporter.
 *
 * Invoked by Claude Code hooks on state transitions. Reads JSON from stdin
 * and writes a session state file to ~/.claude-deck/session-states/{session_id}.json.
 *
 * Installed to ~/.claude-deck/hooks/state-reporter by the setup module.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const STATES_DIR = path.join(os.homedir(), ".claude-deck", "session-states");

interface HookInput {
  session_id: string;
  hook_event_name: string;
  tool_name?: string;
  tool_input?: unknown;
  last_assistant_message?: string;
  stop_hook_active?: boolean;
  reason?: string;
}

interface StateFile {
  status: "running" | "waiting" | "idle";
  lastLine: string;
  waitingContext?: string;
  ts: number;
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    // Safety timeout — don't hang if stdin never closes
    setTimeout(() => resolve(data), 1000);
  });
}

function getStatePath(sessionId: string): string {
  return path.join(STATES_DIR, `${sessionId}.json`);
}

function writeState(sessionId: string, state: StateFile): void {
  fs.mkdirSync(STATES_DIR, { recursive: true });
  fs.writeFileSync(getStatePath(sessionId), JSON.stringify(state));
}

function deleteState(sessionId: string): void {
  try {
    fs.unlinkSync(getStatePath(sessionId));
  } catch {
    // file may not exist
  }
}

async function main(): Promise<void> {
  const raw = await readStdin();
  if (!raw.trim()) return;

  let input: HookInput;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const { session_id, hook_event_name } = input;
  if (!session_id) return;

  switch (hook_event_name) {
    case "SessionEnd":
      deleteState(session_id);
      break;

    case "PermissionRequest":
      writeState(session_id, {
        status: "waiting",
        lastLine: `Waiting: ${input.tool_name || "permission"}`,
        waitingContext: input.tool_name
          ? `Permission requested for ${input.tool_name}`
          : "Permission requested",
        ts: Date.now(),
      });
      break;

    case "Stop":
      // Only transition to idle if not in a stop-hook re-run loop
      if (!input.stop_hook_active) {
        writeState(session_id, {
          status: "idle",
          lastLine: input.last_assistant_message?.slice(0, 200) || "",
          ts: Date.now(),
        });
      }
      break;

    default:
      // UserPromptSubmit, SessionStart, PreToolUse, PostToolUse, PermissionDenied
      writeState(session_id, {
        status: "running",
        lastLine: input.tool_name
          ? `Running: ${input.tool_name}`
          : "Running...",
        ts: Date.now(),
      });
      break;
  }
}

main().catch(() => process.exit(0));
