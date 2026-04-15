import { spawn, exec, type ChildProcess } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { broadcast } from "./claude/watcher";

const execAsync = promisify(exec);
const LOGS_DIR = path.join(process.env.HOME || "~", ".claude-deck", "logs");

const URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
const URL_TIMEOUT_MS = 20000;

interface Tunnel {
  port: number;
  pid: number;
  url: string | null;
  process: ChildProcess;
}

// Use globalThis to share the Map across Next.js module boundaries
// (API routes and the custom server may load this module separately)
const GLOBAL_KEY = "__claudeDeckTunnels" as const;
const activeTunnels: Map<number, Tunnel> =
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] as Map<
    number,
    Tunnel
  >) ??
  (() => {
    const map = new Map<number, Tunnel>();
    (globalThis as Record<string, unknown>)[GLOBAL_KEY] = map;
    return map;
  })();

export async function isCloudflaredInstalled(): Promise<boolean> {
  try {
    await execAsync("cloudflared --version 2>/dev/null");
    return true;
  } catch {
    return false;
  }
}

export async function startTunnel(
  port: number
): Promise<{ port: number; url: string | null }> {
  const existing = activeTunnels.get(port);
  if (existing) return { port: existing.port, url: existing.url };

  const logPath = path.join(LOGS_DIR, `tunnel_${port}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  const child = spawn(
    "cloudflared",
    [
      "tunnel",
      "--url",
      `http://localhost:${port}`,
      "--http-host-header",
      `localhost:${port}`,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    }
  );

  const tunnel: Tunnel = {
    port,
    pid: child.pid || 0,
    url: null,
    process: child,
  };
  activeTunnels.set(port, tunnel);

  const url = await new Promise<string | null>((resolve) => {
    const timeout = setTimeout(() => resolve(null), URL_TIMEOUT_MS);
    let resolved = false;

    const handleData = (chunk: Buffer) => {
      const text = chunk.toString();
      logStream.write(text);
      if (resolved) return;
      const match = text.match(URL_PATTERN);
      if (match) {
        resolved = true;
        clearTimeout(timeout);
        resolve(match[0]);
      }
    };

    child.stdout?.on("data", handleData);
    child.stderr?.on("data", handleData);

    child.on("exit", () => {
      if (!resolved) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  });

  tunnel.url = url;

  child.on("exit", () => {
    activeTunnels.delete(port);
    logStream.end();
    broadcastTunnelUpdate();
  });

  broadcastTunnelUpdate();
  return { port, url };
}

export async function stopTunnel(port: number): Promise<void> {
  const tunnel = activeTunnels.get(port);
  if (!tunnel) return;

  try {
    tunnel.process.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!tunnel.process.killed) {
      tunnel.process.kill("SIGKILL");
    }
  } catch {
    // Process may already be dead
  }

  activeTunnels.delete(port);
  broadcastTunnelUpdate();
}

export function getTunnelUrls(): Record<number, string> {
  const result: Record<number, string> = {};
  for (const [port, tunnel] of activeTunnels) {
    if (tunnel.url) result[port] = tunnel.url;
  }
  return result;
}

export function getTunnelsList(): { port: number; url: string | null }[] {
  return [...activeTunnels.values()].map((t) => ({ port: t.port, url: t.url }));
}

export function stopAllTunnels(): void {
  for (const [, tunnel] of activeTunnels) {
    try {
      tunnel.process.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  activeTunnels.clear();
}

function broadcastTunnelUpdate(): void {
  broadcast({ type: "tunnels-updated", tunnels: getTunnelUrls() });
}
