import { NextRequest, NextResponse } from "next/server";
import { getMultiRepoGitStatus } from "@/lib/multi-repo-git";
import { expandPath } from "@/lib/git-status";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fallbackPath = searchParams.get("fallbackPath");

    if (!fallbackPath) {
      return NextResponse.json(
        { error: "fallbackPath is required" },
        { status: 400 }
      );
    }

    const expandedFallback = expandPath(fallbackPath);
    const status = getMultiRepoGitStatus([], expandedFallback);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching multi-repo git status:", error);
    return NextResponse.json(
      { error: "Failed to fetch git status" },
      { status: 500 }
    );
  }
}
