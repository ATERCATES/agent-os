import type { Session } from "@/lib/db";

export interface SessionStatus {
  sessionName: string;
  status: "idle" | "running" | "waiting" | "error" | "dead";
  lastLine?: string;
}

export interface SessionListProps {
  activeSessionId?: string;
  sessionStatuses?: Record<string, SessionStatus>;
  onSelect: (sessionId: string) => void;
  onOpenInTab?: (sessionId: string) => void;
  onNewSessionInProject?: (projectId: string) => void;
  onOpenTerminal?: (workingDirectory: string) => void;
  onStartDevServer?: (workingDirectory: string) => void;
  onResumeClaudeSession?: (
    claudeSessionId: string,
    cwd: string,
    summary?: string,
    projectName?: string
  ) => void;
  onNewSession?: (cwd?: string, projectName?: string) => void;
  onCreateDevServer?: (opts: {
    projectId?: string | null;
    type: "node" | "docker";
    name: string;
    command: string;
    workingDirectory: string;
    ports?: number[];
  }) => Promise<void>;
}

export interface SessionHoverHandlers {
  onHoverStart: (session: Session, rect: DOMRect) => void;
  onHoverEnd: () => void;
}
