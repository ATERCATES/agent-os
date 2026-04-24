"use client";

import { useState, useMemo } from "react";
import { ChevronsDownUp, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  useClaudeProjectsQuery,
  useClaudeUpdates,
  useWorktreeStatuses,
  type ClaudeProject,
  type WorktreeSummary,
} from "@/data/claude";
import { ClaudeProjectCard } from "./ClaudeProjectCard";
import { collapseAllProjects } from "@/hooks/useProjectExpansion";

interface ClaudeProjectsSectionProps {
  onSelectSession?: (
    sessionId: string,
    directory: string,
    summary: string,
    projectName: string
  ) => void;
  onNewSession?: (cwd: string, projectName: string) => void;
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-1 px-2 py-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="bg-muted h-4 w-4 animate-pulse rounded" />
          <div
            className="bg-muted h-3.5 animate-pulse rounded"
            style={{ width: `${60 + Math.random() * 60}px` }}
          />
          <div className="flex-1" />
          <div className="bg-muted h-3 w-4 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

interface ProjectGroup {
  parent: ClaudeProject;
  children: ClaudeProject[];
}

function groupByParent(projects: ClaudeProject[]): ProjectGroup[] {
  const byDirectory = new Map<string, ClaudeProject>();
  for (const p of projects) {
    if (p.directory) byDirectory.set(p.directory, p);
  }

  const groups: ProjectGroup[] = [];
  const groupByName = new Map<string, ProjectGroup>();

  for (const p of projects) {
    if (p.isWorktree) continue;
    const group: ProjectGroup = { parent: p, children: [] };
    groups.push(group);
    groupByName.set(p.name, group);
  }

  for (const p of projects) {
    if (!p.isWorktree) continue;
    const parent = p.parentRoot ? byDirectory.get(p.parentRoot) : undefined;
    const parentGroup = parent ? groupByName.get(parent.name) : undefined;
    if (parentGroup) {
      parentGroup.children.push(p);
    } else {
      const orphan: ProjectGroup = { parent: p, children: [] };
      groups.push(orphan);
      groupByName.set(p.name, orphan);
    }
  }

  return groups;
}

export function ClaudeProjectsSection({
  onSelectSession,
  onNewSession,
}: ClaudeProjectsSectionProps) {
  useClaudeUpdates();
  const { data: projects = [], isPending } = useClaudeProjectsQuery();
  const [showHidden, setShowHidden] = useState(false);

  const groups = useMemo(() => {
    const visible = showHidden ? projects : projects.filter((p) => !p.hidden);
    return groupByParent(visible);
  }, [projects, showHidden]);

  const worktreePaths = useMemo(
    () =>
      groups.flatMap(
        (g) => g.children.map((c) => c.directory).filter(Boolean) as string[]
      ),
    [groups]
  );
  const { data: statuses = [] } = useWorktreeStatuses(worktreePaths);
  const worktreeStatuses = useMemo<Map<string, WorktreeSummary>>(
    () => new Map(statuses.map((s) => [s.path, s])),
    [statuses]
  );

  const hiddenCount = projects.filter((p) => p.hidden).length;

  return (
    <div>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-muted-foreground text-xs font-medium">
          Projects
        </span>
        <div className="flex items-center gap-1">
          {isPending && (
            <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
          )}
          <button
            onClick={collapseAllProjects}
            title="Collapse all"
            aria-label="Collapse all projects"
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <ChevronsDownUp size={14} />
          </button>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>

      {isPending && projects.length === 0 && <ProjectsSkeleton />}

      <div className="space-y-0.5">
        {groups.map((group) => (
          <ClaudeProjectCard
            key={group.parent.name}
            project={group.parent}
            worktreeChildren={group.children}
            worktreeStatuses={worktreeStatuses}
            showHidden={showHidden}
            onSelectSession={onSelectSession}
            onNewSession={onNewSession}
          />
        ))}
      </div>
    </div>
  );
}
