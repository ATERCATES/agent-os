import { NextRequest, NextResponse } from "next/server";
import { queries } from "@/lib/db";
import {
  getSessionMessages,
  getClaudeProjectNames,
  getSessions,
} from "@/lib/claude/jsonl-reader";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function findProjectForSession(
  sessionId: string
): Promise<string | null> {
  const projectNames = getClaudeProjectNames();
  for (const projectName of projectNames) {
    const { sessions } = await getSessions(projectName, 100, 0);
    if (sessions.some((s) => s.sessionId === sessionId)) {
      return projectName;
    }
  }
  return null;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const session = await queries.getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const claudeSessionId = session.claude_session_id || id;
    const projectName = await findProjectForSession(claudeSessionId);

    if (!projectName) {
      return NextResponse.json({ messages: [], total: 0, hasMore: false });
    }

    const result = await getSessionMessages(
      projectName,
      claudeSessionId,
      limit,
      offset
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
