"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, GitBranch, Loader2 } from "lucide-react";
import type { ClaudeProject } from "@/data/claude";

const ADJECTIVES = [
  "swift",
  "bright",
  "calm",
  "bold",
  "keen",
  "vivid",
  "crisp",
  "warm",
  "cool",
  "sharp",
];
const NOUNS = [
  "falcon",
  "river",
  "prism",
  "cedar",
  "spark",
  "orbit",
  "ridge",
  "frost",
  "coral",
  "flint",
];

function generateName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}`;
}

interface GitInfo {
  isGitRepo: boolean;
  branches: string[];
  defaultBranch: string | null;
}

interface NewClaudeSessionDialogProps {
  open: boolean;
  projectName: string;
  projects?: ClaudeProject[];
  onClose: () => void;
  onConfirm: (name: string, cwd?: string, projectName?: string) => void;
}

export function NewClaudeSessionDialog({
  open,
  projectName,
  projects,
  onClose,
  onConfirm,
}: NewClaudeSessionDialogProps) {
  const [name, setName] = useState("");
  const [selectedProject, setSelectedProject] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Worktree state
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [useWorktree, setUseWorktree] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [creating, setCreating] = useState(false);

  const cwd = (() => {
    if (selectedProject) {
      const project = projects?.find((p) => p.name === selectedProject);
      return project?.directory || undefined;
    }
    return undefined;
  })();

  // Check git repo when cwd changes
  useEffect(() => {
    if (!cwd) {
      setGitInfo(null);
      setUseWorktree(false);
      return;
    }

    let cancelled = false;
    fetch("/api/git/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: cwd }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setGitInfo(data);
        if (data.defaultBranch) setBaseBranch(data.defaultBranch);
      })
      .catch(() => {
        if (!cancelled) setGitInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [cwd]);

  useEffect(() => {
    if (open) {
      setName(generateName());
      setSelectedProject(projectName);
      setUseWorktree(false);
      setFeatureName("");
      setCreating(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open, projectName]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const sessionName = name.trim() || generateName();
      let targetCwd = cwd;

      if (useWorktree && featureName.trim() && cwd) {
        setCreating(true);
        try {
          const res = await fetch("/api/worktrees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectPath: cwd,
              featureName: featureName.trim(),
              baseBranch,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Failed to create worktree");
            setCreating(false);
            return;
          }
          const worktree = await res.json();
          targetCwd = worktree.worktreePath;
        } catch {
          alert("Failed to create worktree");
          setCreating(false);
          return;
        }
        setCreating(false);
      }

      onConfirm(sessionName, targetCwd, selectedProject || undefined);
    },
    [
      name,
      cwd,
      useWorktree,
      featureName,
      baseBranch,
      selectedProject,
      onConfirm,
    ]
  );

  const showProjectSelector = projects && projects.length > 0 && !projectName;
  const branchPreview = featureName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !creating && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">New session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showProjectSelector ? (
            <div>
              <label className="text-muted-foreground mb-2 block text-xs">
                Project
              </label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter((p) => !p.hidden && p.sessionCount > 0)
                    .map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            projectName && (
              <p className="text-muted-foreground text-xs">{projectName}</p>
            )
          )}

          <div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Session name"
                className="h-9"
                disabled={creating}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 shrink-0"
                onClick={() => setName(generateName())}
                disabled={creating}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {gitInfo?.isGitRepo && (
            <div className="bg-accent/40 space-y-3 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useWorktree"
                  checked={useWorktree}
                  onChange={(e) => setUseWorktree(e.target.checked)}
                  className="border-border bg-background accent-primary h-4 w-4 rounded"
                  disabled={creating}
                />
                <label
                  htmlFor="useWorktree"
                  className="flex cursor-pointer items-center gap-1.5 text-sm font-medium"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  Create isolated worktree
                </label>
              </div>

              {useWorktree && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-xs">
                      Feature name
                    </label>
                    <Input
                      value={featureName}
                      onChange={(e) => setFeatureName(e.target.value)}
                      placeholder="add-dark-mode"
                      className="h-8 text-sm"
                      disabled={creating}
                    />
                    {branchPreview && (
                      <p className="text-muted-foreground text-xs">
                        Branch: feature/{branchPreview}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-xs">
                      Base branch
                    </label>
                    <Select
                      value={baseBranch}
                      onValueChange={setBaseBranch}
                      disabled={creating}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gitInfo.branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                creating ||
                (showProjectSelector && !selectedProject) ||
                (useWorktree && !featureName.trim())
              }
            >
              {creating ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Creating worktree...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
