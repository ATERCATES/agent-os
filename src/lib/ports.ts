/**
 * Port Management for Dev Servers
 *
 * Assigns unique ports to worktree sessions to avoid conflicts.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { queries } from "./db";

const execAsync = promisify(exec);

// Port range for dev servers
const BASE_PORT = 3100;
const PORT_INCREMENT = 10;
const MAX_PORT = 3900;

/**
 * Check if a port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `lsof -i :${port} -sTCP:LISTEN 2>/dev/null | head -1`,
      { timeout: 5000 }
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Get all ports currently assigned to sessions
 */
export async function getAssignedPorts(): Promise<number[]> {
  return queries.getAssignedPorts();
}

/**
 * Find the next available port
 */
export async function findAvailablePort(): Promise<number> {
  const assignedPorts = new Set(await getAssignedPorts());

  for (let port = BASE_PORT; port <= MAX_PORT; port += PORT_INCREMENT) {
    // Skip if already assigned to a session
    if (assignedPorts.has(port)) {
      continue;
    }

    // Check if port is actually in use (by something outside ClaudeDeck)
    if (!(await isPortInUse(port))) {
      return port;
    }
  }

  // Fallback: return a random port in range
  return BASE_PORT + Math.floor(Math.random() * 80) * PORT_INCREMENT;
}

/**
 * Assign a port to a session
 */
export async function assignPort(sessionId: string): Promise<number> {
  const port = await findAvailablePort();
  queries.assignPort(port, sessionId);
  return port;
}

/**
 * Release a port from a session
 */
export async function releasePort(sessionId: string): Promise<void> {
  queries.releasePort(sessionId);
}

/**
 * Get the port assigned to a session
 */
export async function getSessionPort(
  sessionId: string
): Promise<number | null> {
  return queries.getSessionPort(sessionId);
}
