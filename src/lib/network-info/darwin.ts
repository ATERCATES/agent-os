import { exec } from "child_process";
import { promisify } from "util";
import type { NetworkInfoProvider, ListeningSocket } from "./types";

const execAsync = promisify(exec);

/**
 * macOS backend for network info.
 *
 * macOS has no /proc filesystem and `netstat` does not reliably expose PIDs
 * across all versions. `lsof` is the only portable tool for PID-to-port
 * mapping on macOS.
 *
 * To minimize overhead, this module caches the full listener scan for 500ms
 * so multiple calls within the same tick reuse a single lsof invocation
 * (mirrors the micro-cache pattern in the Linux /proc backend).
 */

let listenerCache: { data: ListeningSocket[]; ts: number } | null = null;
const CACHE_TTL = 500;

function parseLsofListeners(stdout: string): ListeningSocket[] {
  const results: ListeningSocket[] = [];
  const seen = new Set<string>();
  let currentPid = 0;

  for (const line of stdout.split("\n")) {
    if (line.startsWith("p")) {
      currentPid = parseInt(line.slice(1), 10);
    } else if (line.startsWith("n") && currentPid > 0) {
      const port = parseInt(line.slice(line.lastIndexOf(":") + 1), 10);
      if (!isNaN(port) && port > 0) {
        const key = `${currentPid}:${port}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ pid: currentPid, port });
        }
      }
    }
  }

  return results;
}

async function getCachedListeners(): Promise<ListeningSocket[]> {
  const now = Date.now();
  if (listenerCache && now - listenerCache.ts < CACHE_TTL) {
    return listenerCache.data;
  }

  try {
    const { stdout } = await execAsync(
      `lsof -P -iTCP -sTCP:LISTEN -Fn 2>/dev/null || true`
    );
    const data = parseLsofListeners(stdout);
    listenerCache = { data, ts: now };
    return data;
  } catch {
    return [];
  }
}

const provider: NetworkInfoProvider = {
  async getAllListeners(): Promise<ListeningSocket[]> {
    return getCachedListeners();
  },

  async getPortsForPid(pid: number): Promise<number[]> {
    const all = await getCachedListeners();
    return [
      ...new Set(all.filter((s) => s.pid === pid).map((s) => s.port)),
    ].sort((a, b) => a - b);
  },

  async resolveCwds(pids: number[]): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    if (pids.length === 0) return map;

    try {
      const pidList = pids.join(",");
      const { stdout } = await execAsync(
        `lsof -a -p ${pidList} -d cwd -Fpn 2>/dev/null || true`
      );
      let currentPid = 0;
      for (const line of stdout.split("\n")) {
        if (line.startsWith("p")) {
          currentPid = parseInt(line.slice(1), 10);
        } else if (line.startsWith("n") && currentPid > 0) {
          map.set(currentPid, line.slice(1));
        }
      }
    } catch {
      // CWD resolution failed
    }

    return map;
  },
};

export default provider;
