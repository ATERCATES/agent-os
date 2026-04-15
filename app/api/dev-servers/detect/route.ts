import { NextRequest, NextResponse } from "next/server";
import { detectServers } from "@/lib/dev-servers";

// GET /api/dev-servers/detect?path=X - Auto-detect available dev servers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    // Expand ~ to home directory
    const expandedPath = path.startsWith("~")
      ? path.replace("~", process.env.HOME || "")
      : path;

    const servers = await detectServers(expandedPath);
    return NextResponse.json({ servers, workingDirectory: expandedPath });
  } catch (error) {
    console.error("Error detecting dev servers:", error);
    return NextResponse.json(
      { error: "Failed to detect dev servers" },
      { status: 500 }
    );
  }
}
