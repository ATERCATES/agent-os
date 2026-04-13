/**
 * Projects Module
 *
 * Projects are workspaces that contain sessions and dev server configurations.
 * Sessions inherit settings from their parent project.
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  queries,
  type Project,
  type ProjectDevServer,
  type ProjectRepository,
  type Session,
  type DevServerType,
} from "./db";
import type { AgentType } from "./providers";

const execAsync = promisify(exec);

export interface CreateProjectOptions {
  name: string;
  workingDirectory: string;
  agentType?: AgentType;
  defaultModel?: string;
  initialPrompt?: string;
  devServers?: CreateDevServerOptions[];
}

export interface CreateDevServerOptions {
  name: string;
  type: DevServerType;
  command: string;
  port?: number;
  portEnvVar?: string;
}

export interface DetectedDevServer {
  name: string;
  type: DevServerType;
  command: string;
  port?: number;
  portEnvVar?: string;
}

export interface CreateRepositoryOptions {
  name: string;
  path: string;
  isPrimary?: boolean;
}

export interface ProjectWithDevServers extends Project {
  devServers: ProjectDevServer[];
}

export interface ProjectWithRepositories extends ProjectWithDevServers {
  repositories: ProjectRepository[];
}

// Generate project ID
function generateProjectId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// Generate dev server config ID
function generateDevServerId(): string {
  return `pds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// Generate repository config ID
function generateRepositoryId(): string {
  return `repo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Create a new project
 */
export async function createProject(
  opts: CreateProjectOptions
): Promise<ProjectWithRepositories> {
  const id = generateProjectId();

  // Get next sort order
  const projects = await queries.getAllProjects();
  const maxOrder = projects.reduce((max, p) => Math.max(max, p.sort_order), 0);

  await queries.createProject(
    id,
    opts.name,
    opts.workingDirectory,
    opts.agentType || "claude",
    opts.defaultModel || "sonnet",
    opts.initialPrompt || null,
    maxOrder + 1
  );

  // Create dev server configs if provided
  const devServers: ProjectDevServer[] = [];
  if (opts.devServers) {
    for (let i = 0; i < opts.devServers.length; i++) {
      const ds = opts.devServers[i];
      const dsId = generateDevServerId();
      await queries.createProjectDevServer(
        dsId,
        id,
        ds.name,
        ds.type,
        ds.command,
        ds.port || null,
        ds.portEnvVar || null,
        i
      );
      devServers.push({
        id: dsId,
        project_id: id,
        name: ds.name,
        type: ds.type,
        command: ds.command,
        port: ds.port || null,
        port_env_var: ds.portEnvVar || null,
        sort_order: i,
      });
    }
  }

  const project = await queries.getProject(id);
  return {
    ...project!,
    expanded: Boolean(project!.expanded),
    is_uncategorized: Boolean(project!.is_uncategorized),
    devServers,
    repositories: [],
  };
}

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<Project | undefined> {
  const project = await queries.getProject(id);
  if (!project) return undefined;
  return {
    ...project,
    expanded: Boolean(project.expanded),
    is_uncategorized: Boolean(project.is_uncategorized),
  };
}

/**
 * Get a project with its dev server configurations
 */
export async function getProjectWithDevServers(
  id: string
): Promise<ProjectWithRepositories | undefined> {
  const project = await getProject(id);
  if (!project) return undefined;

  const devServers = await queries.getProjectDevServers(id);
  const rawRepos = await queries.getProjectRepositories(id);
  const repositories = rawRepos.map((r) => ({
    ...r,
    is_primary: Boolean(r.is_primary),
  }));
  return {
    ...project,
    devServers,
    repositories,
  };
}

/**
 * Get all projects (sorted by sort_order, with uncategorized last)
 */
export async function getAllProjects(): Promise<Project[]> {
  const projects = await queries.getAllProjects();
  return projects.map((p) => ({
    ...p,
    expanded: Boolean(p.expanded),
    is_uncategorized: Boolean(p.is_uncategorized),
  }));
}

/**
 * Get all projects with their dev server configurations
 */
export async function getAllProjectsWithDevServers(): Promise<
  ProjectWithRepositories[]
> {
  const projects = await getAllProjects();
  const result: ProjectWithRepositories[] = [];
  for (const p of projects) {
    const devServers = await queries.getProjectDevServers(p.id);
    const rawRepos = await queries.getProjectRepositories(p.id);
    const repositories = rawRepos.map((r) => ({
      ...r,
      is_primary: Boolean(r.is_primary),
    }));
    result.push({
      ...p,
      devServers,
      repositories,
    });
  }
  return result;
}

/**
 * Update a project's settings
 */
export async function updateProject(
  id: string,
  updates: Partial<
    Pick<
      Project,
      | "name"
      | "working_directory"
      | "agent_type"
      | "default_model"
      | "initial_prompt"
    >
  >
): Promise<Project | undefined> {
  const project = await getProject(id);
  if (!project || project.is_uncategorized) return undefined;

  await queries.updateProject(
    updates.name ?? project.name,
    updates.working_directory ?? project.working_directory,
    updates.agent_type ?? project.agent_type,
    updates.default_model ?? project.default_model,
    updates.initial_prompt !== undefined
      ? updates.initial_prompt
      : project.initial_prompt,
    id
  );

  return getProject(id);
}

/**
 * Toggle project expanded state
 */
export async function toggleProjectExpanded(
  id: string,
  expanded: boolean
): Promise<void> {
  await queries.updateProjectExpanded(expanded, id);
}

/**
 * Delete a project (moves sessions to Uncategorized)
 */
export async function deleteProject(id: string): Promise<boolean> {
  const project = await getProject(id);
  if (!project || project.is_uncategorized) return false;

  // Move all sessions to Uncategorized
  const sessions = await queries.getSessionsByProject(id);
  for (const session of sessions) {
    await queries.updateSessionProject("uncategorized", session.id);
  }

  // Delete dev server instances
  await queries.deleteDevServersByProject(id);

  // Delete dev server configs (templates)
  await queries.deleteProjectDevServers(id);

  // Delete project
  await queries.deleteProject(id);
  return true;
}

/**
 * Get sessions for a project
 */
export async function getProjectSessions(
  projectId: string
): Promise<Session[]> {
  return queries.getSessionsByProject(projectId);
}

/**
 * Move a session to a project
 */
export async function moveSessionToProject(
  sessionId: string,
  projectId: string
): Promise<void> {
  await queries.updateSessionProject(projectId, sessionId);
}

/**
 * Add a dev server configuration to a project
 */
export async function addProjectDevServer(
  projectId: string,
  opts: CreateDevServerOptions
): Promise<ProjectDevServer> {
  const id = generateDevServerId();

  // Get next sort order
  const existing = await queries.getProjectDevServers(projectId);
  const maxOrder = existing.reduce(
    (max, ds) => Math.max(max, ds.sort_order),
    -1
  );

  await queries.createProjectDevServer(
    id,
    projectId,
    opts.name,
    opts.type,
    opts.command,
    opts.port || null,
    opts.portEnvVar || null,
    maxOrder + 1
  );

  return (await queries.getProjectDevServer(id))!;
}

/**
 * Update a dev server configuration
 */
export async function updateProjectDevServer(
  id: string,
  updates: Partial<CreateDevServerOptions & { sortOrder?: number }>
): Promise<ProjectDevServer | undefined> {
  const existing = await queries.getProjectDevServer(id);
  if (!existing) return undefined;

  await queries.updateProjectDevServer(
    updates.name ?? existing.name,
    updates.type ?? existing.type,
    updates.command ?? existing.command,
    updates.port ?? existing.port,
    updates.portEnvVar ?? existing.port_env_var,
    updates.sortOrder ?? existing.sort_order,
    id
  );

  return (await queries.getProjectDevServer(id))!;
}

/**
 * Delete a dev server configuration
 */
export async function deleteProjectDevServer(id: string): Promise<void> {
  await queries.deleteProjectDevServer(id);
}

/**
 * Detect available npm scripts from package.json
 */
export async function detectNpmScripts(
  workingDir: string
): Promise<DetectedDevServer[]> {
  const expandedDir = workingDir.replace(/^~/, process.env.HOME || "~");
  const packageJsonPath = path.join(expandedDir, "package.json");

  if (!fs.existsSync(packageJsonPath)) return [];

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const scripts = packageJson.scripts || {};
    const detected: DetectedDevServer[] = [];

    // Common dev server scripts to look for
    const devScripts = [
      "dev",
      "start",
      "serve",
      "develop",
      "preview",
      "start:dev",
    ];

    for (const script of devScripts) {
      if (scripts[script]) {
        const scriptContent: string = scripts[script];

        // Try to detect port from script
        let port: number | undefined;
        const portMatch = scriptContent.match(/(?:port|PORT)[=\s]+(\d+)/i);
        if (portMatch) {
          port = parseInt(portMatch[1], 10);
        }

        // Detect port env var from common patterns
        let portEnvVar: string | undefined;
        if (
          scriptContent.includes("$PORT") ||
          scriptContent.includes("${PORT}")
        ) {
          portEnvVar = "PORT";
        }

        detected.push({
          name: `npm run ${script}`,
          type: "node",
          command: `npm run ${script}`,
          port,
          portEnvVar,
        });
      }
    }

    return detected;
  } catch {
    return [];
  }
}

/**
 * Detect Docker Compose services
 */
export async function detectDockerServices(
  workingDir: string
): Promise<DetectedDevServer[]> {
  const expandedDir = workingDir.replace(/^~/, process.env.HOME || "~");
  const composeFiles = [
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml",
  ];

  for (const file of composeFiles) {
    const composePath = path.join(expandedDir, file);
    if (fs.existsSync(composePath)) {
      try {
        const { stdout } = await execAsync(
          `docker compose -f "${file}" config --services 2>/dev/null || echo ""`,
          { cwd: expandedDir }
        );
        const services = stdout.trim().split("\n").filter(Boolean);

        return services.map((service) => ({
          name: service,
          type: "docker" as const,
          command: service,
        }));
      } catch {
        // Docker not available or compose file invalid
      }
    }
  }

  return [];
}

/**
 * Detect all available dev servers in a directory
 */
export async function detectDevServers(
  workingDir: string
): Promise<DetectedDevServer[]> {
  const [npmScripts, dockerServices] = await Promise.all([
    detectNpmScripts(workingDir),
    detectDockerServices(workingDir),
  ]);

  return [...npmScripts, ...dockerServices];
}

/**
 * Validate a working directory exists
 */
export function validateWorkingDirectory(dir: string): boolean {
  const expandedDir = dir.replace(/^~/, process.env.HOME || "~");
  try {
    return fs.existsSync(expandedDir) && fs.statSync(expandedDir).isDirectory();
  } catch {
    return false;
  }
}

// ============= Repository Management =============

/**
 * Get repositories for a project
 */
export async function getProjectRepositories(
  projectId: string
): Promise<ProjectRepository[]> {
  const rawRepos = await queries.getProjectRepositories(projectId);
  return rawRepos.map((r) => ({
    ...r,
    is_primary: Boolean(r.is_primary),
  }));
}

/**
 * Add a repository to a project
 */
export async function addProjectRepository(
  projectId: string,
  opts: CreateRepositoryOptions
): Promise<ProjectRepository> {
  const id = generateRepositoryId();

  // Get next sort order
  const existing = await getProjectRepositories(projectId);
  const maxOrder = existing.reduce(
    (max, repo) => Math.max(max, repo.sort_order),
    -1
  );

  // If this is the first repository or marked as primary, ensure no other is primary
  const isPrimary = opts.isPrimary || existing.length === 0;
  if (isPrimary) {
    // Clear primary flag from other repositories
    for (const repo of existing) {
      if (repo.is_primary) {
        await queries.updateProjectRepository(
          repo.name,
          repo.path,
          false,
          repo.sort_order,
          repo.id
        );
      }
    }
  }

  await queries.createProjectRepository(
    id,
    projectId,
    opts.name,
    opts.path,
    isPrimary,
    maxOrder + 1
  );

  const raw = (await queries.getProjectRepository(id))!;
  return {
    ...raw,
    is_primary: Boolean(raw.is_primary),
  };
}

/**
 * Update a repository
 */
export async function updateProjectRepository(
  id: string,
  updates: Partial<CreateRepositoryOptions & { sortOrder?: number }>
): Promise<ProjectRepository | undefined> {
  const raw = await queries.getProjectRepository(id);
  if (!raw) return undefined;

  const existing = {
    ...raw,
    is_primary: Boolean(raw.is_primary),
  };

  // If setting as primary, clear other primaries
  const newIsPrimary =
    updates.isPrimary !== undefined ? updates.isPrimary : existing.is_primary;
  if (newIsPrimary && !existing.is_primary) {
    const allRepos = await getProjectRepositories(existing.project_id);
    for (const repo of allRepos) {
      if (repo.is_primary && repo.id !== id) {
        await queries.updateProjectRepository(
          repo.name,
          repo.path,
          false,
          repo.sort_order,
          repo.id
        );
      }
    }
  }

  await queries.updateProjectRepository(
    updates.name ?? existing.name,
    updates.path ?? existing.path,
    newIsPrimary,
    updates.sortOrder ?? existing.sort_order,
    id
  );

  const updatedRaw = (await queries.getProjectRepository(id))!;
  return {
    ...updatedRaw,
    is_primary: Boolean(updatedRaw.is_primary),
  };
}

/**
 * Delete a repository
 */
export async function deleteProjectRepository(id: string): Promise<void> {
  await queries.deleteProjectRepository(id);
}
