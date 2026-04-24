import { NextRequest, NextResponse } from "next/server";
import {
  getCachedProjects,
  invalidateAllProjects,
} from "@/lib/claude/jsonl-cache";
import { assertManagedWorktree, deleteWorktree } from "@/lib/worktrees";
import { removeClaudeProjectDir } from "@/lib/claude/project-artifacts";
import { queries } from "@/lib/db";

export interface ClaudeProject {
  name: string;
  directory: string | null;
  displayName: string;
  sessionCount: number;
  lastActivity: string | null;
  hidden: boolean;
  parentRoot: string | null;
  isWorktree: boolean;
}

export async function GET() {
  try {
    const cachedProjects = await getCachedProjects();
    const hiddenItems = await queries.getHiddenItems("project");
    const hiddenSet = new Set(hiddenItems.map((h) => h.item_id));

    const projects: ClaudeProject[] = cachedProjects.map((p) => ({
      ...p,
      hidden: hiddenSet.has(p.name),
    }));

    projects.sort((a, b) => {
      if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return (
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error discovering Claude projects:", error);
    return NextResponse.json(
      { error: "Failed to discover projects" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { projectName, includeWorktrees } = (await request.json()) as {
      projectName?: string;
      includeWorktrees?: boolean;
    };
    if (!projectName) {
      return NextResponse.json(
        { error: "projectName is required" },
        { status: 400 }
      );
    }

    const projects = await getCachedProjects();
    const target = projects.find((p) => p.name === projectName);
    if (!target) {
      return NextResponse.json({ error: "project not found" }, { status: 404 });
    }

    const failed: string[] = [];
    if (includeWorktrees && target.directory) {
      const children = projects.filter(
        (p) => p.isWorktree && p.parentRoot === target.directory
      );
      for (const child of children) {
        if (!child.directory) continue;
        try {
          assertManagedWorktree(child.directory);
          await deleteWorktree(child.directory, target.directory, true);
        } catch {
          failed.push(child.name);
        }
        await removeClaudeProjectDir(child.name);
      }
    }

    await removeClaudeProjectDir(projectName);
    invalidateAllProjects();
    return NextResponse.json({ ok: true, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete project: ${message}` },
      { status: 400 }
    );
  }
}
