"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Debug log buffer - persists even if console is closed
const debugLogs: string[] = [];
const MAX_DEBUG_LOGS = 100;

function debugLog(message: string) {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 12);
  const entry = `[${timestamp}] ${message}`;
  debugLogs.push(entry);
  if (debugLogs.length > MAX_DEBUG_LOGS) debugLogs.shift();
  console.log(`[ClaudeDeck] ${message}`);
}

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as unknown as { claudeDeckLogs: () => void }).claudeDeckLogs = () => {
    console.log("=== ClaudeDeck Debug Logs ===");
    debugLogs.forEach((log) => console.log(log));
    console.log("=== End Logs ===");
  };
}
import { PaneProvider, usePanes } from "@/contexts/PaneContext";
import { Pane } from "@/components/Pane";
import { useNotifications } from "@/hooks/useNotifications";
import { useViewport } from "@/hooks/useViewport";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useSessions } from "@/hooks/useSessions";
import { useDevServersManager } from "@/hooks/useDevServersManager";
import { useSessionStatusesQuery } from "@/data/statuses";
import type { Session } from "@/lib/db";
import type { TerminalHandle } from "@/components/Terminal";
import { CLAUDE_COMMAND, buildClaudeFlags } from "@/lib/providers";
import { DesktopView } from "@/components/views/DesktopView";
import { MobileView } from "@/components/views/MobileView";
import { getPendingPrompt, clearPendingPrompt } from "@/stores/initialPrompt";
import { NewClaudeSessionDialog } from "@/components/NewClaudeSessionDialog";
import { useClaudeProjectsQuery } from "@/data/claude";

function HomeContent() {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const terminalRefs = useRef<Map<string, TerminalHandle>>(new Map());

  // Pane context
  const { focusedPaneId, attachSession, getActiveTab, addTab } = usePanes();
  const focusedActiveTab = getActiveTab(focusedPaneId);
  const { isMobile, isHydrated } = useViewport();

  // Data hooks
  const { sessions, fetchSessions } = useSessions();
  const { data: claudeProjects } = useClaudeProjectsQuery();
  const {
    startDevServerProjectId,
    setStartDevServerProjectId,
    startDevServer,
    createDevServer,
  } = useDevServersManager();

  const pollClaudeSessionId = useCallback(
    async (sessionId: string, maxAttempts = 20, intervalMs = 500) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const res = await fetch(`/api/sessions/${sessionId}/claude-session`);
          const data = await res.json();
          if (data?.claude_session_id) {
            await fetchSessions();
            return data.claude_session_id as string;
          }
        } catch {
          // keep polling
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
      return null;
    },
    [fetchSessions]
  );

  // Helper to get init script command from API
  const getInitScriptCommand = useCallback(
    async (agentCommand: string): Promise<string> => {
      try {
        const res = await fetch("/api/sessions/init-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentCommand }),
        });
        const data = await res.json();
        return data.command || agentCommand;
      } catch {
        return agentCommand;
      }
    },
    []
  );

  // Set CSS variable for viewport height (handles mobile keyboard)
  useViewportHeight();

  // Terminal ref management
  const registerTerminalRef = useCallback(
    (paneId: string, tabId: string, ref: TerminalHandle | null) => {
      const key = `${paneId}:${tabId}`;
      if (ref) {
        terminalRefs.current.set(key, ref);
        debugLog(
          `Terminal registered: ${key}, total refs: ${terminalRefs.current.size}`
        );
      } else {
        terminalRefs.current.delete(key);
        debugLog(
          `Terminal unregistered: ${key}, total refs: ${terminalRefs.current.size}`
        );
      }
    },
    []
  );

  // Get terminal for a pane, with fallback to first available
  const getTerminalWithFallback = useCallback(():
    | { terminal: TerminalHandle; paneId: string; tabId: string }
    | undefined => {
    debugLog(
      `getTerminalWithFallback called, total refs: ${terminalRefs.current.size}, focusedPaneId: ${focusedPaneId}`
    );

    // Try focused pane first
    const activeTab = getActiveTab(focusedPaneId);
    debugLog(`activeTab for focused pane: ${activeTab?.id || "null"}`);

    if (activeTab) {
      const key = `${focusedPaneId}:${activeTab.id}`;
      const terminal = terminalRefs.current.get(key);
      debugLog(
        `Looking for terminal at key "${key}": ${terminal ? "found" : "not found"}`
      );
      if (terminal) {
        return { terminal, paneId: focusedPaneId, tabId: activeTab.id };
      }
    }

    // Fallback to first available terminal
    const firstEntry = terminalRefs.current.entries().next().value;
    if (firstEntry) {
      const [key, terminal] = firstEntry as [string, TerminalHandle];
      const [paneId, tabId] = key.split(":");
      debugLog(`Using fallback terminal: ${key}`);
      return { terminal, paneId, tabId };
    }

    debugLog(
      `NO TERMINAL FOUND. Available keys: ${Array.from(terminalRefs.current.keys()).join(", ") || "none"}`
    );
    return undefined;
  }, [focusedPaneId, getActiveTab]);

  // Build tmux command for a session
  const buildSessionCommand = useCallback(
    async (
      session: Session
    ): Promise<{ sessionName: string; cwd: string; command: string }> => {
      const sessionName = session.tmux_name || `claude-${session.id}`;
      const cwd = session.working_directory?.replace("~", "$HOME") || "$HOME";

      let parentSessionId: string | null = null;
      if (!session.claude_session_id && session.parent_session_id) {
        const parentSession = sessions.find(
          (s) => s.id === session.parent_session_id
        );
        parentSessionId = parentSession?.claude_session_id || null;
      }

      const initialPrompt = getPendingPrompt(session.id);
      if (initialPrompt) {
        clearPendingPrompt(session.id);
      }

      const flags = buildClaudeFlags({
        sessionId: session.claude_session_id,
        parentSessionId,
        autoApprove: session.auto_approve,
        model: session.model,
        initialPrompt: initialPrompt || undefined,
      });

      const agentCmd = `${CLAUDE_COMMAND} ${flags.join(" ")}`;
      const command = await getInitScriptCommand(agentCmd);

      return { sessionName, cwd, command };
    },
    [sessions, getInitScriptCommand]
  );

  // Attach a session to a terminal
  const runSessionInTerminal = useCallback(
    (
      terminal: TerminalHandle,
      paneId: string,
      session: Session,
      sessionInfo: { sessionName: string; cwd: string; command: string }
    ) => {
      const { sessionName, cwd, command } = sessionInfo;
      const tmuxNew = command
        ? `tmux new -s ${sessionName} -c "${cwd}" "${command}"`
        : `tmux new -s ${sessionName} -c "${cwd}"`;
      terminal.sendCommand(
        `tmux set -g mouse on 2>/dev/null; tmux set -g set-clipboard on 2>/dev/null; tmux attach -t ${sessionName} 2>/dev/null || ${tmuxNew}`
      );
      attachSession(paneId, session.id, sessionName);
      terminal.focus();
    },
    [attachSession]
  );

  // Attach session to terminal
  const attachToSession = useCallback(
    async (session: Session) => {
      const terminalInfo = getTerminalWithFallback();
      if (!terminalInfo) {
        debugLog(
          `ERROR: No terminal available to attach session: ${session.name}`
        );
        alert(
          `[ClaudeDeck Debug] No terminal available!\n\nRun claudeDeckLogs() in console to see debug logs.`
        );
        return;
      }

      const { terminal, paneId } = terminalInfo;
      const activeTab = getActiveTab(paneId);
      const isInTmux = !!activeTab?.attachedTmux;

      if (isInTmux) {
        terminal.sendInput("\x02d");
      }

      setTimeout(
        () => {
          terminal.sendInput("\x03");
          setTimeout(async () => {
            const sessionInfo = await buildSessionCommand(session);
            runSessionInTerminal(terminal, paneId, session, sessionInfo);
          }, 50);
        },
        isInTmux ? 100 : 0
      );
    },
    [
      getTerminalWithFallback,
      getActiveTab,
      buildSessionCommand,
      runSessionInTerminal,
    ]
  );

  // Open session in new tab
  const openSessionInNewTab = useCallback(
    (session: Session) => {
      const existingKeys = new Set(terminalRefs.current.keys());
      addTab(focusedPaneId);

      let attempts = 0;
      const maxAttempts = 20;

      const waitForNewTerminal = () => {
        attempts++;

        for (const key of terminalRefs.current.keys()) {
          if (!existingKeys.has(key) && key.startsWith(`${focusedPaneId}:`)) {
            const terminal = terminalRefs.current.get(key);
            if (terminal) {
              buildSessionCommand(session).then((sessionInfo) => {
                runSessionInTerminal(
                  terminal,
                  focusedPaneId,
                  session,
                  sessionInfo
                );
              });
              return;
            }
          }
        }

        if (attempts < maxAttempts) {
          setTimeout(waitForNewTerminal, 50);
        } else {
          debugLog(`Failed to find new terminal after ${maxAttempts} attempts`);
        }
      };

      setTimeout(waitForNewTerminal, 50);
    },
    [addTab, focusedPaneId, buildSessionCommand, runSessionInTerminal]
  );

  const resumeClaudeSession = useCallback(
    (
      sessionIdOrClaudeId: string,
      cwd: string,
      sessionName?: string,
      projectName?: string
    ) => {
      const terminalInfo = getTerminalWithFallback();
      if (!terminalInfo) return;

      const matchedSession = sessions.find(
        (s) =>
          s.id === sessionIdOrClaudeId ||
          s.claude_session_id === sessionIdOrClaudeId
      );
      const claudeSessionId =
        matchedSession?.claude_session_id || sessionIdOrClaudeId;

      if (matchedSession && !matchedSession.claude_session_id) {
        void pollClaudeSessionId(matchedSession.id);
        alert(
          "Session is still initializing. Please try resume again in a moment."
        );
        return;
      }

      const { terminal, paneId } = terminalInfo;
      const activeTab = getActiveTab(paneId);
      const isInTmux = !!activeTab?.attachedTmux;

      const tmuxName = `claude-${claudeSessionId}`;
      const tmuxCmd = [
        `tmux kill-session -t ${tmuxName} 2>/dev/null;`,
        `tmux new -s ${tmuxName} -c "${cwd}" "claude --resume ${claudeSessionId} || claude --continue"`,
      ].join(" ");

      if (isInTmux) {
        terminal.sendInput("\x02d");
      }

      setTimeout(
        () => {
          terminal.sendInput("\x03");
          setTimeout(() => {
            terminal.sendCommand(tmuxCmd);
            attachSession(
              paneId,
              matchedSession?.id || claudeSessionId,
              tmuxName,
              sessionName,
              projectName,
              cwd
            );
            terminal.focus();
          }, 50);
        },
        isInTmux ? 100 : 0
      );
    },
    [
      getTerminalWithFallback,
      getActiveTab,
      attachSession,
      sessions,
      pollClaudeSessionId,
    ]
  );

  const [newSessionPending, setNewSessionPending] = useState<{
    cwd: string;
    projectName: string;
  } | null>(null);

  const newClaudeSession = useCallback((cwd?: string, projectName?: string) => {
    setNewSessionPending({ cwd: cwd || "~", projectName: projectName || "" });
  }, []);

  const handleNewClaudeSessionConfirm = useCallback(
    async (name: string, overrideCwd?: string, overrideProject?: string) => {
      if (!newSessionPending) return;
      setNewSessionPending(null);

      const terminalInfo = getTerminalWithFallback();
      if (!terminalInfo) return;

      const { terminal, paneId } = terminalInfo;
      const activeTab = getActiveTab(paneId);
      const isInTmux = !!activeTab?.attachedTmux;
      const cwd = overrideCwd || newSessionPending.cwd;
      const projectName = overrideProject || newSessionPending.projectName;

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          workingDirectory: cwd,
          agentType: "claude",
          useTmux: true,
        }),
      });
      const data = await res.json();
      const session = data.session as Session | undefined;
      if (!session?.id || !session.tmux_name) return;
      const tmuxCmd = `tmux new -s ${session.tmux_name} -c "${cwd}" "claude"`;
      void pollClaudeSessionId(session.id);

      if (isInTmux) {
        terminal.sendInput("\x02d");
      }

      setTimeout(
        () => {
          terminal.sendInput("\x03");
          setTimeout(() => {
            terminal.sendCommand(tmuxCmd);
            attachSession(
              paneId,
              session.id,
              session.tmux_name!,
              name,
              projectName,
              cwd
            );
            terminal.focus();
          }, 50);
        },
        isInTmux ? 100 : 0
      );

      if (isMobile) setSidebarOpen(false);
    },
    [
      newSessionPending,
      getTerminalWithFallback,
      getActiveTab,
      attachSession,
      isMobile,
      pollClaudeSessionId,
    ]
  );

  // Notification click handler
  const handleNotificationClick = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        attachToSession(session);
      }
    },
    [sessions, attachToSession]
  );

  // Notifications
  const {
    settings: notificationSettings,
    checkStateChanges,
    updateSettings,
    requestPermission,
    permissionGranted,
  } = useNotifications({ onSessionClick: handleNotificationClick });

  // Session statuses
  const { sessionStatuses } = useSessionStatusesQuery({
    sessions,
    activeSessionId: focusedActiveTab?.sessionId,
    checkStateChanges,
  });

  // Set initial sidebar state based on viewport (only after hydration)
  useEffect(() => {
    if (isHydrated && !isMobile) setSidebarOpen(true);
  }, [isMobile, isHydrated]);

  // Keyboard shortcut: Cmd+K to open quick switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Session selection handler
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      debugLog(`handleSelectSession called for: ${sessionId}`);
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        debugLog(`Found session: ${session.name}, calling attachToSession`);
        attachToSession(session);
      } else {
        debugLog(
          `Session not found in sessions array (length: ${sessions.length})`
        );
      }
    },
    [sessions, attachToSession]
  );

  // Pane renderer
  const renderPane = useCallback(
    (paneId: string) => (
      <Pane
        key={paneId}
        paneId={paneId}
        sessions={sessions}
        sessionStatuses={sessionStatuses}
        onRegisterTerminal={registerTerminalRef}
        onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
        onSelectSession={handleSelectSession}
        onResumeClaudeSession={resumeClaudeSession}
      />
    ),
    [
      sessions,
      sessionStatuses,
      registerTerminalRef,
      isMobile,
      handleSelectSession,
      resumeClaudeSession,
    ]
  );

  // Open terminal handler (shell session, not AI agent)
  const handleOpenTerminal = useCallback(
    async (cwd: string) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Terminal",
          workingDirectory: cwd || "~",
          agentType: "shell",
        }),
      });

      const data = await res.json();
      if (!data.session) return;

      await fetchSessions();

      setTimeout(() => {
        attachToSession(data.session);
      }, 100);
    },
    [fetchSessions, attachToSession]
  );

  // Active session
  const activeSession = sessions.find(
    (s) => s.id === focusedActiveTab?.sessionId
  );

  // View props
  const viewProps = {
    sessions,
    sessionStatuses,
    sidebarOpen,
    setSidebarOpen,
    activeSession,
    focusedActiveTab,
    copiedSessionId,
    setCopiedSessionId,
    showNotificationSettings,
    setShowNotificationSettings,
    showQuickSwitcher,
    setShowQuickSwitcher,
    notificationSettings,
    permissionGranted,
    updateSettings,
    requestPermission,
    attachToSession,
    openSessionInNewTab,
    handleOpenTerminal,
    handleStartDevServer: startDevServer,
    handleCreateDevServer: createDevServer,
    startDevServerProjectId,
    setStartDevServerProjectId,
    newClaudeSession,
    resumeClaudeSession,
    renderPane,
  };

  const view = isMobile ? (
    <MobileView {...viewProps} />
  ) : (
    <DesktopView {...viewProps} />
  );

  return (
    <>
      {view}
      <NewClaudeSessionDialog
        open={!!newSessionPending}
        projectName={newSessionPending?.projectName || ""}
        projects={claudeProjects}
        onClose={() => setNewSessionPending(null)}
        onConfirm={handleNewClaudeSessionConfirm}
      />
    </>
  );
}

export default function Home() {
  return (
    <PaneProvider>
      <HomeContent />
    </PaneProvider>
  );
}
