import { useState, useCallback } from "react";
import {
  useDevServersQuery,
  useStopDevServer,
  useRestartDevServer,
  useRemoveDevServer,
  useCreateDevServer,
} from "@/data/dev-servers";

interface CreateDevServerOptions {
  projectId?: string | null;
  type: "node" | "docker";
  name: string;
  command: string;
  workingDirectory: string;
  ports?: number[];
}

export function useDevServersManager() {
  const { data: devServers = [] } = useDevServersQuery();
  const [startDevServerProjectId, setStartDevServerProjectId] = useState<
    string | null
  >(null);

  const stopMutation = useStopDevServer();
  const restartMutation = useRestartDevServer();
  const removeMutation = useRemoveDevServer();
  const createMutation = useCreateDevServer();

  const startDevServer = useCallback((workingDirectory: string) => {
    setStartDevServerProjectId(workingDirectory);
  }, []);

  const stopDevServer = useCallback(
    async (serverId: string) => {
      await stopMutation.mutateAsync(serverId);
    },
    [stopMutation]
  );

  const restartDevServer = useCallback(
    async (serverId: string) => {
      await restartMutation.mutateAsync(serverId);
    },
    [restartMutation]
  );

  const removeDevServer = useCallback(
    async (serverId: string) => {
      await removeMutation.mutateAsync(serverId);
    },
    [removeMutation]
  );

  const createDevServer = useCallback(
    async (opts: CreateDevServerOptions) => {
      await createMutation.mutateAsync(opts);
      setStartDevServerProjectId(null);
    },
    [createMutation]
  );

  return {
    devServers,
    startDevServerProjectId,
    setStartDevServerProjectId,
    startDevServer,
    stopDevServer,
    restartDevServer,
    removeDevServer,
    createDevServer,
  };
}
