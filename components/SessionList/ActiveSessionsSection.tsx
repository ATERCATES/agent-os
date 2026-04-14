"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Activity,
  AlertCircle,
  Moon,
  Globe,
  Share2,
  X,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import type { SessionStatus } from "@/components/views/types";
import {
  useCloudflaredStatus,
  useStartTunnel,
  useStopTunnel,
} from "@/data/tunnels/queries";

interface ActiveSessionsSectionProps {
  sessionStatuses: Record<string, SessionStatus>;
  onSelect: (sessionId: string) => void;
}

const STATUS_ORDER: Record<string, number> = {
  waiting: 0,
  running: 1,
  idle: 2,
};

export function ActiveSessionsSection({
  sessionStatuses,
  onSelect,
}: ActiveSessionsSectionProps) {
  const activeSessions = useMemo(() => {
    return Object.entries(sessionStatuses)
      .filter(
        ([, s]) =>
          s.status === "running" ||
          s.status === "waiting" ||
          s.status === "idle"
      )
      .map(([id, s]) => ({ id, ...s }))
      .sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
      );
  }, [sessionStatuses]);

  const hasWaiting = activeSessions.some((s) => s.status === "waiting");
  const [expanded, setExpanded] = useState(hasWaiting);

  useEffect(() => {
    if (hasWaiting) setExpanded(true);
  }, [hasWaiting]);

  const { data: cfStatus } = useCloudflaredStatus();
  const cloudflaredInstalled = cfStatus?.installed ?? false;

  if (activeSessions.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors",
          hasWaiting
            ? "text-amber-500"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-90"
          )}
        />
        <span>Active Sessions</span>
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[10px]",
            hasWaiting
              ? "bg-amber-500/20 text-amber-500"
              : "bg-muted text-muted-foreground"
          )}
        >
          {activeSessions.length}
        </span>
      </button>

      {expanded && (
        <div className="space-y-0.5 px-1.5">
          {activeSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className="hover:bg-accent group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
            >
              <StatusIcon status={session.status} />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {session.sessionName}
                </span>
                {session.lastLine && (
                  <span className="text-muted-foreground block truncate font-mono text-[10px]">
                    {session.lastLine}
                  </span>
                )}
                {session.listeningPorts &&
                  session.listeningPorts.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {session.listeningPorts.map((port) => (
                        <PortBadge
                          key={port}
                          port={port}
                          tunnelUrl={session.tunnelUrls?.[port]}
                          cloudflaredInstalled={cloudflaredInstalled}
                        />
                      ))}
                    </div>
                  )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PortBadge({
  port,
  tunnelUrl,
  cloudflaredInstalled,
}: {
  port: number;
  tunnelUrl?: string;
  cloudflaredInstalled: boolean;
}) {
  const startTunnel = useStartTunnel();
  const stopTunnel = useStopTunnel();
  const [copied, setCopied] = useState(false);

  const isStarting = startTunnel.isPending;
  const hasTunnel = !!tunnelUrl;

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasTunnel) {
        stopTunnel.mutate(port);
      } else {
        startTunnel.mutate(port);
      }
    },
    [hasTunnel, port, startTunnel, stopTunnel]
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tunnelUrl) {
        navigator.clipboard.writeText(tunnelUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [tunnelUrl]
  );

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <a
          href={`http://localhost:${port}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px] text-sky-400 transition-colors hover:bg-sky-500/25"
        >
          <Globe className="h-2.5 w-2.5" />
          {port}
        </a>
        {cloudflaredInstalled && (
          <button
            onClick={handleShare}
            disabled={isStarting}
            className={cn(
              "rounded p-0.5 transition-colors",
              hasTunnel
                ? "text-emerald-400 hover:bg-emerald-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={hasTunnel ? "Stop sharing" : "Share via tunnel"}
          >
            {isStarting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : hasTunnel ? (
              <X className="h-3 w-3" />
            ) : (
              <Share2 className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
      {tunnelUrl && (
        <div className="flex items-center gap-1">
          <a
            href={tunnelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex max-w-[180px] items-center gap-0.5 truncate rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 transition-colors hover:bg-emerald-500/25"
          >
            <Globe className="h-2.5 w-2.5 flex-shrink-0" />
            {tunnelUrl
              .replace("https://", "")
              .replace(".trycloudflare.com", "")}
          </a>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "running") {
    return (
      <Activity className="h-3 w-3 flex-shrink-0 animate-pulse text-green-500" />
    );
  }
  if (status === "waiting") {
    return (
      <AlertCircle className="h-3 w-3 flex-shrink-0 animate-pulse text-amber-500" />
    );
  }
  return <Moon className="h-3 w-3 flex-shrink-0 text-gray-400" />;
}
