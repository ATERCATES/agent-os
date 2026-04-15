"use client";

import { useState, useRef, useCallback } from "react";
import { ClaudeProjectsSection } from "@/components/ClaudeProjects";
import { FolderPicker } from "@/components/FolderPicker";
import { ActiveSessionsSection } from "./ActiveSessionsSection";
import { SelectionToolbar } from "./SelectionToolbar";
import { SessionListHeader } from "./SessionListHeader";
import { KillAllConfirm } from "./KillAllConfirm";
import { useSessionListMutations } from "./hooks/useSessionListMutations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import type { Session } from "@/lib/db";
import { useViewport } from "@/hooks/useViewport";

import { useSessionsQuery } from "@/data/sessions";
import { useClaudeProjectsQuery } from "@/data/claude";
import { useCloneRepo } from "@/data/git/queries";

import type { SessionListProps } from "./SessionList.types";

export type { SessionListProps } from "./SessionList.types";

function extractRepoName(url: string): string {
  const match = url.trim().match(/\/([\w.-]+?)(?:\.git)?$/);
  return match?.[1] || "repo";
}

function extractFolderName(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1] || "project";
}

export function SessionList({
  activeSessionId: _activeSessionId,
  sessionStatuses,
  onSelect,
  onOpenInTab: _onOpenInTab,
  onNewSessionInProject: _onNewSessionInProject,
  onOpenTerminal: _onOpenTerminal,
  onStartDevServer: _onStartDevServer,
  onCreateDevServer: _onCreateDevServer,
  onResumeClaudeSession,
  onNewSession,
}: SessionListProps) {
  const { isMobile } = useViewport();

  const {
    data: sessionsData,
    isPending: isSessionsPending,
    isError: isSessionsError,
    error: sessionsError,
  } = useSessionsQuery();

  const { isPending: isClaudePending, isError: isClaudeError } =
    useClaudeProjectsQuery();

  const isInitialLoading = isSessionsPending || isClaudePending;
  const hasError = isSessionsError || isClaudeError;

  const sessions = sessionsData?.sessions ?? [];
  const allSessionIds = sessions.map((s: Session) => s.id);

  const mutations = useSessionListMutations({ onSelectSession: onSelect });
  const cloneRepo = useCloneRepo();

  const [showKillAllConfirm, setShowKillAllConfirm] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderPickerMode, setFolderPickerMode] = useState<"open" | "clone">(
    "open"
  );
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneDirectory, setCloneDirectory] = useState("");
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneError, setCloneError] = useState<string | null>(null);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHoverRef = useRef<{
    session: Session;
    rect: DOMRect;
  } | null>(null);

  const _hoverHandlers = {
    onHoverStart: useCallback(
      (_session: Session, _rect: DOMRect) => {
        if (isMobile) return;
      },
      [isMobile]
    ),
    onHoverEnd: useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      pendingHoverRef.current = null;
    }, []),
  };

  const openProjectPicker = () => {
    setFolderPickerMode("open");
    setShowFolderPicker(true);
  };

  const openClonePicker = () => {
    setFolderPickerMode("clone");
    setShowFolderPicker(true);
  };

  const handleFolderSelect = (path: string) => {
    setShowFolderPicker(false);
    if (folderPickerMode === "open") {
      onNewSession?.(path, extractFolderName(path));
      return;
    }

    setCloneDirectory(path);
    setCloneUrl("");
    setCloneError(null);
    setShowCloneDialog(true);
  };

  const handleCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCloneError(null);

    const trimmedUrl = cloneUrl.trim();
    if (!trimmedUrl) {
      setCloneError("Repository URL is required");
      return;
    }

    cloneRepo.mutate(
      { url: trimmedUrl, directory: cloneDirectory },
      {
        onSuccess: (data) => {
          const repoName = data.name || extractRepoName(trimmedUrl);
          setShowCloneDialog(false);
          setCloneUrl("");
          setCloneDirectory("");
          onNewSession?.(data.path, repoName);
        },
        onError: (error) => {
          setCloneError(error.message || "Failed to clone repository");
        },
      }
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SessionListHeader
        onNewSession={() => onNewSession?.()}
        onOpenProject={openProjectPicker}
        onStartFromGit={openClonePicker}
        onKillAll={() => setShowKillAllConfirm(true)}
      />

      {showKillAllConfirm && (
        <KillAllConfirm
          onCancel={() => setShowKillAllConfirm(false)}
          onComplete={() => setShowKillAllConfirm(false)}
        />
      )}

      <SelectionToolbar
        allSessionIds={allSessionIds}
        onDeleteSessions={mutations.handleBulkDelete}
      />

      {mutations.summarizingSessionId && (
        <div className="bg-primary/10 mx-4 mb-2 flex items-center gap-2 rounded-lg p-2 text-sm">
          <Loader2 className="text-primary h-4 w-4 animate-spin" />
          <span className="text-primary">Generating summary...</span>
        </div>
      )}

      <ScrollArea className="w-full flex-1">
        <div className="max-w-full space-y-0.5 px-1.5 py-1">
          {hasError && !isInitialLoading && (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <AlertCircle className="text-destructive/50 mb-3 h-10 w-10" />
              <p className="text-destructive mb-2 text-sm">
                Failed to load sessions
              </p>
              <p className="text-muted-foreground mb-4 text-xs">
                {sessionsError?.message || "Unknown error"}
              </p>
              <Button
                variant="outline"
                onClick={mutations.handleRefresh}
                className="gap-2"
              >
                Retry
              </Button>
            </div>
          )}

          {!isInitialLoading && !hasError && sessionStatuses && (
            <ActiveSessionsSection
              sessionStatuses={sessionStatuses}
              onSelect={onSelect}
            />
          )}

          {!isInitialLoading && !hasError && (
            <ClaudeProjectsSection
              onSelectSession={(claudeSessionId, cwd, summary, projectName) => {
                onResumeClaudeSession?.(
                  claudeSessionId,
                  cwd,
                  summary,
                  projectName
                );
              }}
              onNewSession={onNewSession}
            />
          )}
        </div>
      </ScrollArea>
      {showFolderPicker && (
        <FolderPicker
          onClose={() => setShowFolderPicker(false)}
          onSelect={handleFolderSelect}
        />
      )}
      <Dialog
        open={showCloneDialog}
        onOpenChange={(open) => {
          if (cloneRepo.isPending) return;
          setShowCloneDialog(open);
          if (!open) {
            setCloneUrl("");
            setCloneError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start from Git</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCloneSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Clone into</label>
              <p className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
                {cloneDirectory}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Repository URL</label>
              <Input
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                autoFocus
              />
            </div>
            {cloneError && <p className="text-sm text-red-500">{cloneError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCloneDialog(false)}
                disabled={cloneRepo.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={cloneRepo.isPending || !cloneUrl.trim()}
              >
                {cloneRepo.isPending ? "Cloning..." : "Clone & Start Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
