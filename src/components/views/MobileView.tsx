"use client";

import { SessionList } from "@/components/SessionList";
import { StartServerDialog } from "@/components/DevServers/StartServerDialog";
import { SidebarFooter } from "@/components/SidebarFooter";
import { PaneLayout } from "@/components/PaneLayout";
import { SwipeSidebar } from "@/components/mobile/SwipeSidebar";
import { QuickSwitcher } from "@/components/QuickSwitcher";
import type { ViewProps } from "./types";

export function MobileView({
  sessions,
  sessionStatuses,
  sidebarOpen,
  setSidebarOpen,
  activeSession: _activeSession,
  focusedActiveTab,
  showQuickSwitcher,
  setShowQuickSwitcher,
  attachToSession,
  openSessionInNewTab,
  handleOpenTerminal,
  handleStartDevServer,
  handleCreateDevServer,
  startDevServerProjectId,
  setStartDevServerProjectId,
  newClaudeSession,
  resumeClaudeSession,
  renderPane,
}: ViewProps) {
  return (
    <main className="h-app bg-background flex flex-col overflow-hidden">
      {/* Swipe sidebar */}
      <SwipeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <div className="flex h-full flex-col">
          {/* Session list */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <SessionList
              activeSessionId={focusedActiveTab?.sessionId || undefined}
              sessionStatuses={sessionStatuses}
              onSelect={(id) => {
                const session = sessions.find((s) => s.id === id);
                if (session) {
                  attachToSession(session);
                } else {
                  const status = sessionStatuses[id];
                  resumeClaudeSession(id, status?.cwd || "~");
                }
                setSidebarOpen(false);
              }}
              onOpenInTab={(id) => {
                const session = sessions.find((s) => s.id === id);
                if (session) openSessionInNewTab(session);
                setSidebarOpen(false);
              }}
              onOpenTerminal={handleOpenTerminal}
              onStartDevServer={handleStartDevServer}
              onCreateDevServer={handleCreateDevServer}
              onResumeClaudeSession={resumeClaudeSession}
              onNewSession={newClaudeSession}
            />
          </div>

          <SidebarFooter />
        </div>
      </SwipeSidebar>

      {/* Terminal fills the screen */}
      <div className="min-h-0 w-full flex-1">
        <PaneLayout renderPane={renderPane} />
      </div>

      {/* Dialogs */}
      <QuickSwitcher
        open={showQuickSwitcher}
        onOpenChange={setShowQuickSwitcher}
        currentSessionId={focusedActiveTab?.sessionId ?? undefined}
        onResumeClaudeSession={resumeClaudeSession}
      />
      {startDevServerProjectId && (
        <StartServerDialog
          workingDirectory={startDevServerProjectId}
          onStart={handleCreateDevServer}
          onClose={() => setStartDevServerProjectId(null)}
        />
      )}
    </main>
  );
}
