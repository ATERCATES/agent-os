import {
  extractProjectDirectory,
  getSessions,
  getClaudeProjectNames,
  type SessionInfo,
} from "./jsonl-reader";

export interface CachedProject {
  name: string;
  directory: string | null;
  displayName: string;
  sessionCount: number;
  lastActivity: string | null;
}

function deriveDisplayName(directory: string | null, encoded: string): string {
  if (directory) {
    const parts = directory.split("/");
    return parts[parts.length - 1] || directory;
  }
  const decoded = encoded.replace(/^-/, "/").replace(/-/g, "/");
  const parts = decoded.split("/");
  return parts[parts.length - 1] || decoded;
}

let projectsData: CachedProject[] | null = null;
let projectsBuilding: Promise<CachedProject[]> | null = null;

async function buildProjects(): Promise<CachedProject[]> {
  const projectNames = getClaudeProjectNames();
  return Promise.all(
    projectNames.map(async (name) => {
      const [directory, sessionData] = await Promise.all([
        extractProjectDirectory(name),
        getSessions(name, 1, 0),
      ]);
      return {
        name,
        directory,
        displayName: deriveDisplayName(directory, name),
        sessionCount: sessionData.total,
        lastActivity: sessionData.sessions[0]?.lastActivity || null,
      };
    })
  );
}

export async function getCachedProjects(): Promise<CachedProject[]> {
  if (projectsData) return projectsData;
  if (projectsBuilding) return projectsBuilding;

  projectsBuilding = buildProjects();
  projectsData = await projectsBuilding;
  projectsBuilding = null;
  return projectsData;
}

export async function getCachedSessions(
  projectName: string
): Promise<SessionInfo[]> {
  const { sessions } = await getSessions(projectName, 200, 0);
  return sessions;
}

export function invalidateProject(_projectName: string): void {
  projectsData = null;
}

export function invalidateAll(): void {
  projectsData = null;
}
