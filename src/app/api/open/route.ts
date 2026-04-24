import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import {
  detectExternalEditors,
  getNativeOpenCommand,
} from "@/lib/external-editors";
import { isClaudeDeckWorktree } from "@/lib/worktrees";
import { getCachedProjects } from "@/lib/claude/jsonl-cache";

const execFileAsync = promisify(execFile);

type Editor = "vscode" | "cursor" | "finder";

async function isAllowedPath(path: string): Promise<boolean> {
  let resolved: string;
  try {
    resolved = await fs.promises.realpath(path);
  } catch {
    return false;
  }
  if (isClaudeDeckWorktree(resolved)) return true;
  const projects = await getCachedProjects();
  return projects.some((p) => p.directory && p.directory === resolved);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: string; editor?: Editor };
    const { path, editor } = body;
    if (!path || !editor) {
      return NextResponse.json(
        { error: "path and editor are required" },
        { status: 400 }
      );
    }
    if (!["vscode", "cursor", "finder"].includes(editor)) {
      return NextResponse.json({ error: "invalid editor" }, { status: 400 });
    }
    if (!(await isAllowedPath(path))) {
      return NextResponse.json({ error: "path not allowed" }, { status: 400 });
    }

    const availability = await detectExternalEditors();
    if (editor === "vscode" && !availability.vscode) {
      return NextResponse.json(
        { error: "vscode not available" },
        { status: 500 }
      );
    }
    if (editor === "cursor" && !availability.cursor) {
      return NextResponse.json(
        { error: "cursor not available" },
        { status: 500 }
      );
    }

    const bin =
      editor === "vscode"
        ? "code"
        : editor === "cursor"
          ? "cursor"
          : getNativeOpenCommand();

    await execFileAsync(bin, [path], { timeout: 5000 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: `open failed: ${message}` },
      { status: 500 }
    );
  }
}
