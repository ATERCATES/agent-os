export interface ListeningSocket {
  pid: number;
  port: number;
}

export interface ListeningProcess {
  pid: string;
  port: number;
  cwd: string;
}

export interface NetworkInfoProvider {
  getAllListeners(): Promise<ListeningSocket[]>;
  getPortsForPid(pid: number): Promise<number[]>;
  resolveCwds(pids: number[]): Promise<Map<number, string>>;
}
