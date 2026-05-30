import { promises as fs } from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".mirrorwave");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");

export interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number;
}

export interface TokenStore {
  spotify?: OAuthToken;
  tidal?: OAuthToken;
  youtube?: OAuthToken;
}

export interface SyncState {
  /** Per-destination set of Spotify track ids already mirrored there. */
  synced: Record<string, string[]>;
  /** Legacy field (single-destination Tidal); migrated into `synced.tidal`. */
  syncedSpotifyTrackIds?: string[];
  /** Legacy field; retained for backwards compatibility. */
  initialized?: boolean;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir();
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function loadTokens(): Promise<TokenStore> {
  return readJson<TokenStore>(TOKENS_FILE, {});
}

export async function saveTokens(tokens: TokenStore): Promise<void> {
  await writeJson(TOKENS_FILE, tokens);
}

export async function updateTokens(
  patch: Partial<TokenStore>,
): Promise<TokenStore> {
  const current = await loadTokens();
  const merged = { ...current, ...patch };
  await saveTokens(merged);
  return merged;
}

export async function loadState(): Promise<SyncState> {
  const raw = await readJson<SyncState>(STATE_FILE, { synced: {} });
  const synced: Record<string, string[]> = { ...(raw.synced ?? {}) };

  // Migrate legacy single-destination state into the per-destination shape.
  if (!synced.tidal && Array.isArray(raw.syncedSpotifyTrackIds)) {
    synced.tidal = raw.syncedSpotifyTrackIds;
  }

  return { synced };
}

export async function saveState(state: SyncState): Promise<void> {
  // Persist only the current shape (drop legacy fields once migrated).
  await writeJson(STATE_FILE, { synced: state.synced });
}

/** Returns the set of already-synced Spotify track ids for a destination. */
export function syncedSetFor(state: SyncState, destination: string): Set<string> {
  return new Set(state.synced[destination] ?? []);
}

/** Whether a destination has any persisted progress yet. */
export function hasProgress(state: SyncState, destination: string): boolean {
  return Array.isArray(state.synced[destination]);
}
