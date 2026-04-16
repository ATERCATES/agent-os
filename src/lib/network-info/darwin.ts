import { exec } from "child_process";
import { promisify } from "util";
import type { NetworkInfoProvider, ListeningSocket } from "./types";

const execAsync = promisify(exec);

function parseNetstatOutput(stdout: string): ListeningSocket[] {
  const results: ListeningSocket[] = [];
  const seen = new Set<string>();

  for (const line of stdout.split("\n")) {
    if (!line.includes("LISTEN")) continue;

    const fields = line.trim().split(/\s+/);
    if (fields.length < 9) continue;

    const localAddr = fields[3];
    const lastDot = localAddr.lastIndexOf(".");
    if (lastDot === -1) continue;

    const port = parseInt(localAddr.slice(lastDot + 1), 10);
    const pid = parseInt(fields[8], 10);

    if (isNaN(port) || port <= 0 || isNaN(pid) || pid <= 0) continue;

    const key = `${pid}:${port}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ pid, port });
    }
  }

  return results;
}

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

async function getAllListenersViaNetstat(): Promise<ListeningSocket[]> {
  try {
    const { stdout } = await execAsync(
      `netstat -anv -p tcp 2>/dev/null || true`
    );
    const results = parseNetstatOutput(stdout);
    if (results.length > 0) return results;
  } catch {
    // netstat failed
  }

  return getAllListenersViaLsof();
}

async function getAllListenersViaLsof(): Promise<ListeningSocket[]> {
  try {
    const { stdout } = await execAsync(
      `lsof -P -iTCP -sTCP:LISTEN -Fn 2>/dev/null || true`
    );
    return parseLsofListeners(stdout);
  } catch {
    return [];
  }
}

const provider: NetworkInfoProvider = {
  async getAllListeners(): Promise<ListeningSocket[]> {
    return getAllListenersViaNetstat();
  },

  async getPortsForPid(pid: number): Promise<number[]> {
    try {
      const { stdout } = await execAsync(
        `lsof -P -iTCP -sTCP:LISTEN -a -p ${pid} -Fn 2>/dev/null || true`
      );
      const ports = new Set<number>();
      for (const line of stdout.split("\n")) {
        if (line.startsWith("n")) {
          const port = parseInt(line.slice(line.lastIndexOf(":") + 1), 10);
          if (!isNaN(port) && port > 0) ports.add(port);
        }
      }
      return [...ports].sort((a, b) => a - b);
    } catch {
      return [];
    }
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
