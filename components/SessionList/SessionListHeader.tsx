import { ADropdownMenu, menuItem } from "@/components/a/ADropdownMenu";
import {
  Plus,
  FolderOpen,
  GitBranch,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

interface SessionListHeaderProps {
  onNewSession: () => void;
  onOpenProject: () => void;
  onStartFromGit: () => void;
  onKillAll: () => void;
}

export function SessionListHeader({
  onNewSession,
  onOpenProject,
  onStartFromGit,
  onKillAll,
}: SessionListHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
        <h2 className="font-semibold">ClaudeDeck</h2>
      </div>
      <div className="flex gap-1">
        <ADropdownMenu
          icon={Plus}
          tooltip="Session actions"
          items={[
            menuItem("New Session", onNewSession, { icon: Plus }),
            menuItem("Open Project", onOpenProject, { icon: FolderOpen }),
            menuItem("Start from Git", onStartFromGit, { icon: GitBranch }),
          ]}
        />
        <ADropdownMenu
          icon={MoreHorizontal}
          tooltip="More options"
          items={[
            menuItem("Kill all sessions", onKillAll, {
              icon: Trash2,
              variant: "destructive",
            }),
          ]}
        />
      </div>
    </div>
  );
}
