"use client";

import { useState } from "react";
import { ChevronDown, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { DevServerCard } from "./DevServerCard";
import type { DevServer } from "@/lib/db";

interface DevServersSectionProps {
  servers: DevServer[];
  onStart: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onRestart: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onViewLogs: (id: string) => void;
}

export function DevServersSection({
  servers,
  onStart,
  onStop,
  onRestart,
  onRemove,
  onViewLogs,
}: DevServersSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (servers.length === 0) return null;

  // Count running servers
  const runningCount = servers.filter((s) => s.status === "running").length;

  return (
    <div className="border-border/50 border-b">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2",
          "hover:bg-muted/50 transition-colors"
        )}
      >
        <ChevronDown
          className={cn(
            "text-muted-foreground h-4 w-4 transition-transform",
            !expanded && "-rotate-90"
          )}
        />
        <Server className="text-muted-foreground h-4 w-4" />
        <span className="flex-1 text-left text-sm font-medium">
          Dev Servers
        </span>
        {runningCount > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5",
              "text-[10px] font-medium",
              "bg-green-500/20 text-green-500"
            )}
          >
            {runningCount} running
          </span>
        )}
        <span className="text-muted-foreground text-xs">{servers.length}</span>
      </button>

      {/* Server list */}
      {expanded && (
        <div className="space-y-2 px-3 pb-3">
          {servers.map((server) => (
            <DevServerCard
              key={server.id}
              server={server}
              onStart={onStart}
              onStop={onStop}
              onRestart={onRestart}
              onRemove={onRemove}
              onViewLogs={onViewLogs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
