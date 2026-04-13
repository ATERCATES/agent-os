import { useEffect, useRef, useState, useCallback } from "react";
import type { Session } from "@/lib/db";
import type { SessionStatus } from "@/components/views/types";

interface UseSessionStatusesOptions {
  sessions: Session[];
  activeSessionId?: string | null;
  checkStateChanges: (
    states: Array<{
      id: string;
      name: string;
      status: SessionStatus["status"];
    }>,
    activeSessionId?: string | null
  ) => void;
}

export function useSessionStatusesQuery({
  sessions,
  activeSessionId,
  checkStateChanges,
}: UseSessionStatusesOptions) {
  const [sessionStatuses, setSessionStatuses] = useState<
    Record<string, SessionStatus>
  >({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const handleStatuses = useCallback(
    (statuses: Record<string, SessionStatus>) => {
      setSessionStatuses(statuses);
    },
    []
  );

  // Check state changes when statuses or sessions update
  useEffect(() => {
    if (Object.keys(sessionStatuses).length === 0) return;

    const sessionStates = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      status: (sessionStatuses[s.id]?.status ||
        "dead") as SessionStatus["status"],
    }));
    checkStateChanges(sessionStates, activeSessionId);
  }, [sessionStatuses, sessions, activeSessionId, checkStateChanges]);

  // WebSocket connection for push-based updates
  useEffect(() => {
    let disposed = false;

    function connect() {
      if (disposed) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws/updates`
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "session-statuses") {
            handleStatuses(msg.statuses);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!disposed) {
          // Reconnect after 2s
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Also do an initial HTTP fetch so we don't wait up to 1s for first push
    fetch("/api/sessions/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.statuses && !disposed) {
          handleStatuses(data.statuses);
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [handleStatuses]);

  return {
    sessionStatuses,
    isLoading: false,
  };
}
