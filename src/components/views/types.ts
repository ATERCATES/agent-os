import type { Session } from "@/lib/db";
import type { NotificationSettings } from "@/lib/notifications";
import type { TabData } from "@/lib/panes";

export interface SessionStatus {
  sessionName: string;
  cwd?: string | null;
  status: "idle" | "running" | "waiting" | "error" | "dead";
  lastLine?: string;
  waitingContext?: string;
  claudeSessionId?: string | null;
  listeningPorts?: number[];
  tunnelUrls?: Record<number, string>;
}

export interface ViewProps {
  sessions: Session[];
  sessionStatuses: Record<string, SessionStatus>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeSession: Session | undefined;
  focusedActiveTab: TabData | null;
  copiedSessionId: boolean;
  setCopiedSessionId: (copied: boolean) => void;

  showNotificationSettings: boolean;
  setShowNotificationSettings: (show: boolean) => void;
  showQuickSwitcher: boolean;
  setShowQuickSwitcher: (show: boolean) => void;

  // Notification settings
  notificationSettings: NotificationSettings;
  permissionGranted: boolean;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  requestPermission: () => Promise<boolean>;

  // Handlers
  attachToSession: (session: Session) => void;
  openSessionInNewTab: (session: Session) => void;
  handleOpenTerminal: (cwd: string) => Promise<void>;

  // Dev server (for StartServerDialog)
  handleStartDevServer: (workingDirectory: string) => void;
  handleCreateDevServer: (opts: {
    projectId?: string | null;
    type: "node" | "docker";
    name: string;
    command: string;
    workingDirectory: string;
    ports?: number[];
  }) => Promise<void>;
  startDevServerProjectId: string | null;
  setStartDevServerProjectId: (id: string | null) => void;

  // Claude sessions
  newClaudeSession: (cwd?: string, projectName?: string) => void;
  resumeClaudeSession: (
    claudeSessionId: string,
    cwd: string,
    summary?: string,
    projectName?: string
  ) => void;

  // Pane
  renderPane: (paneId: string) => React.ReactNode;
}
