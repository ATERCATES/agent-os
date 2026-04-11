"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPicker } from "@/components/FolderPicker";
import { useHomePath } from "@/hooks/useHomePath";

import { useNewSessionForm } from "./hooks/useNewSessionForm";
import { AgentSelector } from "./AgentSelector";
import { WorkingDirectoryInput } from "./WorkingDirectoryInput";
import { WorktreeSection } from "./WorktreeSection";
import { CreatingOverlay } from "./CreatingOverlay";
import type { NewSessionDialogProps } from "./NewSessionDialog.types";

export function NewSessionDialog({
  open,
  projects,
  selectedProjectId,
  onClose,
  onCreated,
  onCreateProject,
}: NewSessionDialogProps) {
  const { toTildePath } = useHomePath();
  const form = useNewSessionForm({
    open,
    projects,
    selectedProjectId,
    onCreated,
    onClose,
    onCreateProject,
  });

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && !form.isLoading && form.handleClose()}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.shiftKey && !form.isLoading) {
              e.preventDefault();
              form.handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        >
          {form.isLoading && (
            <CreatingOverlay
              isWorktree={form.useWorktree}
              step={form.creationStep}
            />
          )}
          <DialogHeader>
            <DialogTitle>New Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit} className="space-y-4">
            <AgentSelector
              value={form.agentType}
              onChange={form.handleAgentTypeChange}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
                placeholder="Auto-generated if empty"
                autoFocus
              />
            </div>

            <WorkingDirectoryInput
              value={form.workingDirectory}
              onChange={form.setWorkingDirectory}
              gitInfo={form.gitInfo}
              checkingGit={form.checkingGit}
              onBrowse={() => form.setShowDirectoryPicker(true)}
            />

            {form.gitInfo?.isGitRepo && (
              <WorktreeSection
                gitInfo={form.gitInfo}
                useWorktree={form.useWorktree}
                onUseWorktreeChange={form.setUseWorktree}
                featureName={form.featureName}
                onFeatureNameChange={form.setFeatureName}
                baseBranch={form.baseBranch}
                onBaseBranchChange={form.setBaseBranch}
              />
            )}

            {form.error && <p className="text-sm text-red-500">{form.error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={form.handleClose}
                disabled={form.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.isLoading ||
                  (form.useWorktree && !form.featureName.trim())
                }
              >
                {form.isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {form.showDirectoryPicker && (
        <FolderPicker
          initialPath={form.workingDirectory || "~"}
          onSelect={(path) => {
            form.setWorkingDirectory(toTildePath(path));
            form.setShowDirectoryPicker(false);
          }}
          onClose={() => form.setShowDirectoryPicker(false)}
        />
      )}
    </>
  );
}
