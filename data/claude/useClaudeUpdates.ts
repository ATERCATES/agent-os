"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { claudeKeys } from "./keys";

export function useClaudeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/updates`
    );

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "project-updated") {
          queryClient.refetchQueries({
            queryKey: claudeKeys.sessions(msg.projectName),
          });
          queryClient.refetchQueries({
            queryKey: claudeKeys.projects(),
          });
        }
        if (msg.type === "projects-changed") {
          queryClient.refetchQueries({
            queryKey: claudeKeys.projects(),
          });
        }
      } catch {}
    };

    return () => ws.close();
  }, [queryClient]);
}
