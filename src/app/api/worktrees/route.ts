import { NextRequest, NextResponse } from "next/server";
import {
  assertManagedWorktree,
  createWorktree,
  deleteWorktree,
  renameWorktreeBranch,
} from "@/lib/worktrees";
import { invalidateAllProjects } from "@/lib/claude/jsonl-cache";
import {
  findClaudeProjectByDirectory,
  removeClaudeProjectDir,
} from "@/lib/claude/project-artifacts";

export async function POST(request: NextRequest) {
  try {
    const { projectPath, featureName, baseBranch } = await request.json();

    if (!projectPath || !featureName) {
      return NextResponse.json(
        { error: "projectPath and featureName are required" },
        { status: 400 }
      );
    }

    const worktree = await createWorktree({
      projectPath,
      featureName,
      baseBranch,
    });

    return NextResponse.json(worktree, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create worktree: ${message}` },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { worktreePath, projectPath, deleteBranch } = await request.json();
    if (!worktreePath || !projectPath) {
      return NextResponse.json(
        { error: "worktreePath and projectPath are required" },
        { status: 400 }
      );
    }
    assertManagedWorktree(worktreePath);
    await deleteWorktree(worktreePath, projectPath, Boolean(deleteBranch));
    const match = await findClaudeProjectByDirectory(worktreePath);
    if (match) await removeClaudeProjectDir(match.name);
    invalidateAllProjects();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete worktree: ${message}` },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { worktreePath, projectPath, newBranchName } = await request.json();
    if (!worktreePath || !projectPath || !newBranchName) {
      return NextResponse.json(
        {
          error: "worktreePath, projectPath and newBranchName are required",
        },
        { status: 400 }
      );
    }
    assertManagedWorktree(worktreePath);
    await renameWorktreeBranch(worktreePath, projectPath, newBranchName);
    invalidateAllProjects();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to rename branch: ${message}` },
      { status: 400 }
    );
  }
}
