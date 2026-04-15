// LocalStorage keys
export const SKIP_PERMISSIONS_KEY = "claudeDeck:skipPermissions";
export const RECENT_DIRS_KEY = "claudeDeck:recentDirectories";
export const USE_TMUX_KEY = "claudeDeck:useTmux";
export const MAX_RECENT_DIRS = 5;

// Random feature name generator
const ADJECTIVES = [
  "swift",
  "blue",
  "bright",
  "calm",
  "cool",
  "dark",
  "fast",
  "gold",
  "green",
  "happy",
  "iron",
  "jade",
  "keen",
  "light",
  "loud",
  "mint",
  "neat",
  "nice",
  "pink",
  "pure",
  "quick",
  "red",
  "sage",
  "sharp",
  "slim",
  "soft",
  "warm",
];

const NOUNS = [
  "falcon",
  "river",
  "storm",
  "tiger",
  "wave",
  "cloud",
  "flame",
  "forest",
  "garden",
  "harbor",
  "island",
  "jungle",
  "lake",
  "meadow",
  "ocean",
  "peak",
  "phoenix",
  "rain",
  "shadow",
  "spark",
  "star",
  "stone",
  "sun",
  "thunder",
  "tree",
  "valley",
  "wind",
  "wolf",
];

export function generateFeatureName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}`;
}

// Git info from API
export interface GitInfo {
  isGitRepo: boolean;
  branches: string[];
  defaultBranch: string | null;
  currentBranch: string | null;
}

// Props for main dialog
export interface NewSessionDialogProps {
  open: boolean;
  selectedProjectId?: string;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}
