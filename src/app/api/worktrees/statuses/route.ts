import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import { getGitStatus } from "@/lib/git-status";
import { isClaudeDeckWorktree } from "@/lib/worktrees";
import { getCachedProjects, getCachedSessions } from "@/lib/claude/jsonl-cache";

const execFileAsync = promisify(execFile);
const ACTIVE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

async function summarise(path: string) {
  let dirty = false;
  let ahead = 0;
  let behind = 0;
  let branchName = "";
  let lastCommitSubject = "";
  let lastCommitRelative = "";
  let createdAt = Date.now();
  let activeSessions = 0;

  try {
    const s = getGitStatus(path);
    dirty = s.staged.length + s.unstaged.length + s.untracked.length > 0;
    ahead = s.ahead;
    behind = s.behind;
    branchName = s.branch;
  } catch {
    // not a git dir
  }

  if (!branchName) {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["-C", path, "rev-parse", "--abbrev-ref", "HEAD"],
        { timeout: 2000 }
      );
      branchName = stdout.trim();
    } catch {
      // ignore
    }
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", path, "log", "-1", "--format=%s%n%cr"],
      { timeout: 2000 }
    );
    const [subject = "", relative = ""] = stdout.trim().split("\n");
    lastCommitSubject = subject;
    lastCommitRelative = relative;
  } catch {
    // ignore
  }

  try {
    const stat = await fs.promises.stat(path);
    createdAt = stat.birthtimeMs || stat.mtimeMs;
  } catch {
    // ignore
  }

  try {
    const projects = await getCachedProjects();
    const match = projects.find((p) => p.directory === path);
    if (match) {
      const sessions = await getCachedSessions(match.name);
      const cutoff = Date.now() - ACTIVE_WINDOW_MS;
      activeSessions = sessions.filter((s) => {
        const ts = Date.parse(s.lastActivity);
        return Number.isFinite(ts) && ts >= cutoff;
      }).length;
    }
  } catch {
    // ignore
  }

  return {
    path,
    dirty,
    ahead,
    behind,
    branchName,
    lastCommitSubject,
    lastCommitRelative,
    createdAt,
    activeSessions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { paths } = (await request.json()) as { paths?: string[] };
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: "paths array required" },
        { status: 400 }
      );
    }
    const allowed = paths.filter((p) => isClaudeDeckWorktree(p));
    const results = await Promise.all(allowed.map(summarise));
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
