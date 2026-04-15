import { NextRequest, NextResponse } from "next/server";
import { createWorktree } from "@/lib/worktrees";

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
