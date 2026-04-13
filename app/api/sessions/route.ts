import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { queries, type Session } from "@/lib/db";
import { isValidAgentType, type AgentType } from "@/lib/providers";
import { createWorktree } from "@/lib/worktrees";
import { setupWorktree, type SetupResult } from "@/lib/env-setup";
import { findAvailablePort } from "@/lib/ports";
import { runInBackground } from "@/lib/async-operations";
import { getProject } from "@/lib/projects";

// GET /api/sessions - List all sessions and groups
export async function GET() {
  try {
    const sessions = await queries.getAllSessions();
    const groups = await queries.getAllGroups();

    // Convert expanded from 0/1 to boolean
    const formattedGroups = groups.map((g) => ({
      ...g,
      expanded: Boolean(g.expanded),
    }));

    return NextResponse.json({ sessions, groups: formattedGroups });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// Generate a unique session name
async function generateSessionName(): Promise<string> {
  const sessions = await queries.getAllSessions();
  const existingNumbers = sessions
    .map((s) => {
      const match = s.name.match(/^Session (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `Session ${nextNumber}`;
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name: providedName,
      workingDirectory = "~",
      parentSessionId = null,
      model = "sonnet",
      systemPrompt = null,
      groupPath = "sessions",
      claudeSessionId = null,
      agentType: rawAgentType = "claude",
      autoApprove = false,
      projectId = "uncategorized",
      // Worktree options
      useWorktree = false,
      featureName = null,
      baseBranch = "main",
      // Tmux option
      useTmux = true,
      // Initial prompt to send when session starts
      initialPrompt = null,
    } = body;

    // Validate agent type
    const agentType: AgentType = isValidAgentType(rawAgentType)
      ? rawAgentType
      : "claude";

    // Auto-generate name if not provided
    const name =
      providedName?.trim() ||
      (featureName ? featureName : await generateSessionName());

    const id = randomUUID();

    // Handle worktree creation if requested
    let worktreePath: string | null = null;
    let branchName: string | null = null;
    let actualWorkingDirectory = workingDirectory;
    let port: number | null = null;
    const setupResult: SetupResult | null = null;

    if (useWorktree && featureName) {
      try {
        const worktreeInfo = await createWorktree({
          projectPath: workingDirectory,
          featureName,
          baseBranch,
        });
        worktreePath = worktreeInfo.worktreePath;
        branchName = worktreeInfo.branchName;
        actualWorkingDirectory = worktreeInfo.worktreePath;

        // Find an available port for the dev server
        port = await findAvailablePort();

        // Run environment setup in background (non-blocking)
        // This allows instant UI feedback while npm install runs async
        const capturedWorktreePath = worktreeInfo.worktreePath;
        const capturedSourcePath = workingDirectory;
        const capturedPort = port;
        runInBackground(async () => {
          const result = await setupWorktree({
            worktreePath: capturedWorktreePath,
            sourcePath: capturedSourcePath,
            port: capturedPort,
          });
          console.log("Worktree setup completed:", {
            port: capturedPort,
            envFilesCopied: result.envFilesCopied,
            stepsRun: result.steps.length,
            success: result.success,
          });
        }, `setup-worktree-${id}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          { error: `Failed to create worktree: ${message}` },
          { status: 400 }
        );
      }
    }

    const tmuxName = useTmux ? `${agentType}-${id}` : null;
    await queries.createSession(
      id,
      name,
      tmuxName,
      actualWorkingDirectory,
      parentSessionId,
      model,
      systemPrompt,
      groupPath,
      agentType,
      autoApprove,
      projectId
    );

    // Set worktree info if created
    if (worktreePath) {
      await queries.updateSessionWorktree(
        worktreePath,
        branchName,
        baseBranch,
        port,
        id
      );
    }

    // Set claude_session_id if provided (for importing external sessions)
    if (claudeSessionId) {
      const { getDb } = await import("@/lib/db");
      getDb()
        .prepare("UPDATE sessions SET claude_session_id = ? WHERE id = ?")
        .run(claudeSessionId, id);
    }

    // Messages are no longer stored in our DB - skipping message copy for forked sessions

    const session = await queries.getSession(id);

    // Get project's initial prompt if available
    const project = projectId ? await getProject(projectId) : null;
    const projectInitialPrompt = project?.initial_prompt?.trim();
    const sessionInitialPrompt = initialPrompt?.trim();

    // Combine prompts: project prompt first, then session prompt
    let combinedPrompt: string | undefined;
    if (projectInitialPrompt && sessionInitialPrompt) {
      combinedPrompt = `${projectInitialPrompt}\n\n${sessionInitialPrompt}`;
    } else if (projectInitialPrompt) {
      combinedPrompt = projectInitialPrompt;
    } else if (sessionInitialPrompt) {
      combinedPrompt = sessionInitialPrompt;
    }

    // Include setup result and initial prompt in response
    const response: {
      session: Session | null;
      setup?: SetupResult;
      initialPrompt?: string;
    } = { session };
    if (setupResult) {
      response.setup = setupResult;
    }
    if (combinedPrompt) {
      response.initialPrompt = combinedPrompt;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
