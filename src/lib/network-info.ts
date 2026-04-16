import type { NetworkInfoProvider } from "./network-info/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const provider = require(
  process.platform === "linux"
    ? "./network-info/linux"
    : "./network-info/darwin"
) as { default: NetworkInfoProvider };

export const networkInfo: NetworkInfoProvider = provider.default;

export { isPortAvailable } from "./network-info/port-checker";
export type { ListeningProcess, ListeningSocket } from "./network-info/types";
