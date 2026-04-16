import fs from "fs";
import type { NetworkInfoProvider, ListeningSocket } from "./types";

interface InodeSocket {
  port: number;
  inode: number;
}

let tcpCache: { data: InodeSocket[]; ts: number } | null = null;
const TCP_CACHE_TTL = 500;

function parseProcNetTcp(filePath: string): InodeSocket[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const results: InodeSocket[] = [];
  const lines = content.split("\n");

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(/\s+/);
    if (fields.length < 10) continue;
    if (fields[3] !== "0A") continue;

    const addrParts = fields[1].split(":");
    const port = parseInt(addrParts[addrParts.length - 1], 16);
    const inode = parseInt(fields[9], 10);

    if (port > 0 && inode > 0) {
      results.push({ port, inode });
    }
  }

  return results;
}

function getAllListeningSockets(): InodeSocket[] {
  const now = Date.now();
  if (tcpCache && now - tcpCache.ts < TCP_CACHE_TTL) return tcpCache.data;

  const tcp4 = parseProcNetTcp("/proc/net/tcp");
  const tcp6 = parseProcNetTcp("/proc/net/tcp6");
  const combined = [...tcp4, ...tcp6];
  tcpCache = { data: combined, ts: now };
  return combined;
}

function getSocketInodesForPid(pid: string): Set<number> {
  const inodes = new Set<number>();
  const fdDir = `/proc/${pid}/fd`;

  let entries: string[];
  try {
    entries = fs.readdirSync(fdDir);
  } catch {
    return inodes;
  }

  for (const entry of entries) {
    try {
      const target = fs.readlinkSync(`${fdDir}/${entry}`);
      const match = target.match(/^socket:\[(\d+)\]$/);
      if (match) {
        inodes.add(parseInt(match[1], 10));
      }
    } catch {
      // fd disappeared between readdir and readlink
    }
  }

  return inodes;
}

function readPidCwd(pid: string): string {
  try {
    return fs.readlinkSync(`/proc/${pid}/cwd`);
  } catch {
    return "";
  }
}

function listPids(): string[] {
  try {
    return fs.readdirSync("/proc").filter((entry) => /^\d+$/.test(entry));
  } catch {
    return [];
  }
}

const provider: NetworkInfoProvider = {
  async getAllListeners(): Promise<ListeningSocket[]> {
    const sockets = getAllListeningSockets();
    const inodeToPort = new Map<number, number>();
    for (const s of sockets) {
      inodeToPort.set(s.inode, s.port);
    }

    const results: ListeningSocket[] = [];
    const seen = new Set<string>();

    for (const pid of listPids()) {
      const pidInodes = getSocketInodesForPid(pid);
      for (const inode of pidInodes) {
        const port = inodeToPort.get(inode);
        if (port !== undefined) {
          const key = `${pid}:${port}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ pid: parseInt(pid, 10), port });
          }
        }
      }
    }

    return results;
  },

  async getPortsForPid(pid: number): Promise<number[]> {
    const sockets = getAllListeningSockets();
    const inodeToPort = new Map<number, number>();
    for (const s of sockets) {
      inodeToPort.set(s.inode, s.port);
    }

    const pidInodes = getSocketInodesForPid(String(pid));
    const ports = new Set<number>();

    for (const inode of pidInodes) {
      const port = inodeToPort.get(inode);
      if (port !== undefined) {
        ports.add(port);
      }
    }

    return [...ports].sort((a, b) => a - b);
  },

  async resolveCwds(pids: number[]): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    for (const pid of pids) {
      const cwd = readPidCwd(String(pid));
      if (cwd) map.set(pid, cwd);
    }
    return map;
  },
};

export default provider;
