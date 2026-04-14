import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const tunnelKeys = {
  status: () => ["tunnels", "status"] as const,
};

export function useCloudflaredStatus() {
  return useQuery({
    queryKey: tunnelKeys.status(),
    queryFn: async () => {
      const res = await fetch("/api/tunnels");
      if (!res.ok) return { installed: false, tunnels: [] };
      return res.json() as Promise<{
        installed: boolean;
        tunnels: { port: number; url: string | null }[];
      }>;
    },
    staleTime: 60_000,
  });
}

export function useStartTunnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (port: number) => {
      const res = await fetch(`/api/tunnels/${port}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start tunnel");
      }
      return res.json() as Promise<{ port: number; url: string | null }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tunnelKeys.status() });
    },
  });
}

export function useStopTunnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (port: number) => {
      const res = await fetch(`/api/tunnels/${port}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to stop tunnel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tunnelKeys.status() });
    },
  });
}
