import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { queries } from "@/lib/db";
import { getCachedProjects } from "./jsonl-cache";

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");

/**
 * Remove a Claude project's JSONL dir and its hidden_items row. The source
 * code on disk is never touched. Errors are swallowed because both
 * side-effects are best-effort cleanup after the caller has already succeeded.
 */
export async function removeClaudeProjectDir(
  projectName: string
): Promise<void> {
  const dir = path.join(CLAUDE_PROJECTS_DIR, projectName);
  try {
    await fs.promises.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  try {
    await queries.unhideItem("project", projectName);
  } catch {
    // ignore
  }
}

/**
 * Look up the canonical Claude project entry for a given cwd via the cache.
 * Returns undefined when the cwd does not map to a known project.
 */
export async function findClaudeProjectByDirectory(
  cwd: string
): Promise<{ name: string } | undefined> {
  const projects = await getCachedProjects();
  return projects.find((p) => p.directory === cwd);
}
