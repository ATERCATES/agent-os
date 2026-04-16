/**
 * Port Management for Dev Servers
 *
 * Assigns unique ports to worktree sessions to avoid conflicts.
 */

import { queries } from "./db";
import { isPortAvailable } from "./network-info";

// Port range for dev servers
const BASE_PORT = 3100;
const PORT_INCREMENT = 10;
const MAX_PORT = 3900;

/**
 * Check if a port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  return !(await isPortAvailable(port));
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

  const candidates: number[] = [];
  for (let port = BASE_PORT; port <= MAX_PORT; port += PORT_INCREMENT) {
    if (!assignedPorts.has(port)) candidates.push(port);
  }

  const results = await Promise.all(
    candidates.map(async (port) => ({
      port,
      available: await isPortAvailable(port),
    }))
  );

  const found = results.find((r) => r.available);
  if (found) return found.port;

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
