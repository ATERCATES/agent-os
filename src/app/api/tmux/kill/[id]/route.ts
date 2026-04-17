import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import {
  getManagedSessionPattern,
  getSessionIdFromName,
} from "@/lib/providers";

const execAsync = promisify(exec);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/tmux/kill/[id] - Kill a single managed tmux session by session id.
// Stops the process only; preserves DB row, JSONL history, worktree and assigned port.
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!/^[a-z0-9-]+$/i.test(id)) {
      return NextResponse.json(
        { error: "Invalid session id" },
        { status: 400 }
      );
    }

    const pattern = getManagedSessionPattern();

    const { stdout } = await execAsync(
      'tmux list-sessions -F "#{session_name}" 2>/dev/null || echo ""',
      { timeout: 5000 }
    );

    const target = stdout
      .trim()
      .split("\n")
      .find(
        (name) =>
          name && pattern.test(name) && getSessionIdFromName(name) === id
      );

    if (!target) {
      return NextResponse.json(
        { error: "Active session not found" },
        { status: 404 }
      );
    }

    await execAsync(`tmux kill-session -t "${target}"`, { timeout: 5000 });

    return NextResponse.json({ success: true, killed: target });
  } catch (error) {
    console.error("Error killing tmux session:", error);
    return NextResponse.json(
      { error: "Failed to kill session" },
      { status: 500 }
    );
  }
}
