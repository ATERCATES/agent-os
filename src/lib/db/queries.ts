import { getDb } from "./index";
import type { Session, DevServer, User, AuthSession } from "./types";

function query<T>(sql: string, params: unknown[] = []): T[] {
  return getDb()
    .prepare(sql)
    .all(...params) as T[];
}

function queryOne<T>(sql: string, params: unknown[] = []): T | null {
  return (
    (getDb()
      .prepare(sql)
      .get(...params) as T) ?? null
  );
}

function execute(sql: string, params: unknown[] = []): void {
  getDb()
    .prepare(sql)
    .run(...params);
}

export const queries = {
  createSession: (
    id: string,
    name: string,
    tmuxName: string | null,
    workingDirectory: string,
    parentSessionId: string | null,
    model: string | null,
    systemPrompt: string | null,
    agentType: string,
    autoApprove: boolean,
    projectId: string | null
  ) =>
    execute(
      `INSERT INTO sessions (id, name, tmux_name, working_directory, parent_session_id, model, system_prompt, agent_type, auto_approve, project_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        tmuxName,
        workingDirectory,
        parentSessionId,
        model,
        systemPrompt,
        agentType,
        autoApprove ? 1 : 0,
        projectId,
      ]
    ),

  getSession: (id: string) =>
    queryOne<Session>("SELECT * FROM sessions WHERE id = ?", [id]),

  getAllSessions: () =>
    query<Session>("SELECT * FROM sessions ORDER BY updated_at DESC"),

  updateSessionClaudeId: (claudeSessionId: string, id: string) =>
    execute(
      "UPDATE sessions SET claude_session_id = ?, updated_at = datetime('now') WHERE id = ?",
      [claudeSessionId, id]
    ),

  updateSessionName: (name: string, tmuxName: string, id: string) =>
    execute(
      "UPDATE sessions SET name = ?, tmux_name = ?, updated_at = datetime('now') WHERE id = ?",
      [name, tmuxName, id]
    ),

  deleteSession: (id: string) =>
    execute("DELETE FROM sessions WHERE id = ?", [id]),

  updateSessionWorktree: (
    worktreePath: string | null,
    branchName: string | null,
    baseBranch: string | null,
    port: number | null,
    id: string
  ) =>
    execute(
      "UPDATE sessions SET worktree_path = ?, branch_name = ?, base_branch = ?, dev_server_port = ?, updated_at = datetime('now') WHERE id = ?",
      [worktreePath, branchName, baseBranch, port, id]
    ),

  updateSessionProject: (projectId: string, id: string) =>
    execute(
      "UPDATE sessions SET project_id = ?, updated_at = datetime('now') WHERE id = ?",
      [projectId, id]
    ),

  getSessionsByProject: (projectId: string) =>
    query<Session>(
      "SELECT * FROM sessions WHERE project_id = ? ORDER BY updated_at DESC",
      [projectId]
    ),

  getWorkersByConductor: (conductorId: string) =>
    query<Session>(
      "SELECT * FROM sessions WHERE conductor_session_id = ? ORDER BY created_at ASC",
      [conductorId]
    ),

  updateWorkerStatus: (workerStatus: string, id: string) =>
    execute(
      "UPDATE sessions SET worker_status = ?, updated_at = datetime('now') WHERE id = ?",
      [workerStatus, id]
    ),

  createWorkerSession: (
    id: string,
    name: string,
    tmuxName: string,
    workingDirectory: string,
    conductorSessionId: string,
    workerTask: string,
    model: string | null,
    agentType: string,
    projectId: string | null
  ) =>
    execute(
      `INSERT INTO sessions (id, name, tmux_name, working_directory, conductor_session_id, worker_task, worker_status, model, agent_type, project_id)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        id,
        name,
        tmuxName,
        workingDirectory,
        conductorSessionId,
        workerTask,
        model,
        agentType,
        projectId,
      ]
    ),

  createDevServer: (
    id: string,
    projectId: string | null,
    type: string,
    name: string,
    command: string,
    status: string,
    pid: number | null,
    containerId: string | null,
    ports: string,
    workingDirectory: string
  ) =>
    execute(
      `INSERT INTO dev_servers (id, project_id, type, name, command, status, pid, container_id, ports, working_directory)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        type,
        name,
        command,
        status,
        pid,
        containerId,
        ports,
        workingDirectory,
      ]
    ),

  getDevServer: (id: string) =>
    queryOne<DevServer>("SELECT * FROM dev_servers WHERE id = ?", [id]),

  getAllDevServers: () =>
    query<DevServer>("SELECT * FROM dev_servers ORDER BY created_at DESC"),

  getDevServersByProject: (projectId: string) =>
    query<DevServer>(
      "SELECT * FROM dev_servers WHERE project_id = ? ORDER BY created_at DESC",
      [projectId]
    ),

  updateDevServerStatus: (status: string, id: string) =>
    execute(
      "UPDATE dev_servers SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    ),

  updateDevServerPid: (pid: number | null, status: string, id: string) =>
    execute(
      "UPDATE dev_servers SET pid = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
      [pid, status, id]
    ),

  updateDevServer: (
    status: string,
    pid: number | null,
    containerId: string | null,
    ports: string,
    id: string
  ) =>
    execute(
      "UPDATE dev_servers SET status = ?, pid = ?, container_id = ?, ports = ?, updated_at = datetime('now') WHERE id = ?",
      [status, pid, containerId, ports, id]
    ),

  deleteDevServer: (id: string) =>
    execute("DELETE FROM dev_servers WHERE id = ?", [id]),

  deleteDevServersByProject: (projectId: string) =>
    execute("DELETE FROM dev_servers WHERE project_id = ?", [projectId]),

  getHiddenItems: (itemType: string) =>
    query<{ item_id: string }>(
      "SELECT item_id FROM hidden_items WHERE item_type = ?",
      [itemType]
    ),

  getAllHiddenItems: () =>
    query<{ item_type: string; item_id: string }>(
      "SELECT item_type, item_id FROM hidden_items"
    ),

  hideItem: (itemType: string, itemId: string) =>
    execute(
      "INSERT OR IGNORE INTO hidden_items (item_type, item_id) VALUES (?, ?)",
      [itemType, itemId]
    ),

  unhideItem: (itemType: string, itemId: string) =>
    execute("DELETE FROM hidden_items WHERE item_type = ? AND item_id = ?", [
      itemType,
      itemId,
    ]),

  getUserCount(): number {
    return (
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users") ?? {
        count: 0,
      }
    ).count;
  },

  getUserByUsername(username: string): User | null {
    return queryOne<User>("SELECT * FROM users WHERE username = ?", [username]);
  },

  getUserById(id: string): User | null {
    return queryOne<User>("SELECT * FROM users WHERE id = ?", [id]);
  },

  createUser(
    id: string,
    username: string,
    passwordHash: string,
    totpSecret: string | null
  ): void {
    execute(
      "INSERT INTO users (id, username, password_hash, totp_secret) VALUES (?, ?, ?, ?)",
      [id, username, passwordHash, totpSecret]
    );
  },

  getAuthSessionByToken(token: string): AuthSession | null {
    return queryOne<AuthSession>(
      "SELECT * FROM auth_sessions WHERE token = ?",
      [token]
    );
  },

  createAuthSession(
    id: string,
    token: string,
    userId: string,
    expiresAt: string
  ): void {
    execute(
      "INSERT INTO auth_sessions (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)",
      [id, token, userId, expiresAt]
    );
  },

  renewAuthSession(token: string, expiresAt: string): void {
    execute("UPDATE auth_sessions SET expires_at = ? WHERE token = ?", [
      expiresAt,
      token,
    ]);
  },

  deleteAuthSession(token: string): void {
    execute("DELETE FROM auth_sessions WHERE token = ?", [token]);
  },

  deleteExpiredAuthSessions(): void {
    execute("DELETE FROM auth_sessions WHERE expires_at < datetime('now')");
  },

  getSessionBasic: (id: string) =>
    queryOne<{
      name: string;
      working_directory: string | null;
      claude_session_id: string | null;
    }>(
      "SELECT name, working_directory, claude_session_id FROM sessions WHERE id = ? LIMIT 1",
      [id]
    ),

  touchSession: (id: string) =>
    execute("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?", [
      id,
    ]),

  updateSessionFields: (
    id: string,
    fields: Partial<{
      name: string;
      tmux_name: string;
      status: string;
      working_directory: string;
      system_prompt: string;
    }>
  ) => {
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;
    const sets = entries.map(([k]) => `${k} = ?`);
    sets.push("updated_at = datetime('now')");
    const values = entries.map(([, v]) => v);
    values.push(id);
    execute(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`, values);
  },

  getAssignedPorts: () =>
    query<{ dev_server_port: number }>(
      "SELECT dev_server_port FROM sessions WHERE dev_server_port IS NOT NULL"
    ).map((r) => r.dev_server_port),

  assignPort: (port: number, id: string) =>
    execute("UPDATE sessions SET dev_server_port = ? WHERE id = ?", [port, id]),

  releasePort: (id: string) =>
    execute("UPDATE sessions SET dev_server_port = NULL WHERE id = ?", [id]),

  getSessionPort: (id: string) =>
    queryOne<{ dev_server_port: number | null }>(
      "SELECT dev_server_port FROM sessions WHERE id = ?",
      [id]
    )?.dev_server_port ?? null,
};
