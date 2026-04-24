"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
  useDeleteWorktree,
  type ClaudeProject,
  type WorktreeSummary,
} from "@/data/claude";

interface DeleteWorktreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worktree: ClaudeProject;
  summary?: WorktreeSummary;
}

export function DeleteWorktreeDialog({
  open,
  onOpenChange,
  worktree,
  summary,
}: DeleteWorktreeDialogProps) {
  const deleteMutation = useDeleteWorktree();
  const [deleteBranch, setDeleteBranch] = useState(true);

  const parentPath = worktree.parentRoot || worktree.directory || "";

  const handleDelete = () => {
    if (!worktree.directory) return;
    deleteMutation.mutate(
      {
        worktreePath: worktree.directory,
        projectPath: parentPath,
        deleteBranch,
      },
      {
        onSuccess: () => {
          toast.success("Worktree deleted");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete worktree</DialogTitle>
          <DialogDescription>
            Removes the worktree directory and optionally its local branch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Branch</div>
            <div className="font-mono">
              {summary?.branchName || worktree.displayName}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Path</div>
            <div className="font-mono text-xs break-all">
              {worktree.directory}
            </div>
          </div>

          {summary?.dirty && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
              <span>Has uncommitted changes. They will be lost.</span>
            </div>
          )}

          {!!summary?.activeSessions && summary.activeSessions > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
              <span>
                {summary.activeSessions} Claude session(s) point to this
                worktree in the last 14 days.
              </span>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={deleteBranch}
              onChange={(e) => setDeleteBranch(e.target.checked)}
              className="border-border bg-background accent-primary h-4 w-4 rounded"
            />
            Also delete the local branch
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
