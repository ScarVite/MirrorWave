import type { Config } from "./config";
import { buildDestinations, type Destination } from "./destinations";
import { DestinationStop } from "./destinations/types";
import { getAuthorizedSpotifyApi } from "./spotify/client";
import { getPlaylistTracks, type SpotifyTrack } from "./spotify/playlist";
import { hasProgress, loadState, saveState, syncedSetFor } from "./store";
import { logger } from "./utils/logger";

export interface DestinationResult {
  destination: string;
  newTracks: number;
  added: number;
  skipped: number;
  failed: number;
  stopped: boolean;
}

export interface SyncResult {
  total: number;
  destinations: DestinationResult[];
}

/**
 * Runs a single sync pass: reads the Spotify playlist once, then mirrors any
 * not-yet-synced tracks to each enabled destination. Progress is tracked
 * per-destination so a track that succeeded on one service but failed on
 * another is retried only where needed.
 */
export async function runSync(config: Config): Promise<SyncResult> {
  const spotifyApi = await getAuthorizedSpotifyApi(config);
  const tracks = await getPlaylistTracks(spotifyApi, config.spotify.playlistId);

  const destinations = buildDestinations(config);
  const results: DestinationResult[] = [];

  for (const destination of destinations) {
    results.push(await syncDestination(config, destination, tracks));
  }

  const result: SyncResult = { total: tracks.length, destinations: results };
  logger.info("Sync pass complete", { total: tracks.length, results });
  return result;
}

async function syncDestination(
  config: Config,
  destination: Destination,
  tracks: SpotifyTrack[],
): Promise<DestinationResult> {
  const state = await loadState();
  const synced = syncedSetFor(state, destination.name);
  const firstRun = !hasProgress(state, destination.name);

  const persist = async () => {
    const current = await loadState();
    current.synced[destination.name] = Array.from(synced);
    await saveState(current);
  };

  // First run with baseline mode: mark everything as synced without copying.
  if (firstRun && !config.sync.syncExistingOnFirstRun) {
    for (const t of tracks) synced.add(t.id);
    await persist();
    logger.info(`[${destination.name}] Baseline established; watching for new additions`, {
      baselineCount: tracks.length,
    });
    return {
      destination: destination.name,
      newTracks: 0,
      added: 0,
      skipped: tracks.length,
      failed: 0,
      stopped: false,
    };
  }

  const newTracks = tracks.filter((t) => !synced.has(t.id));
  let added = 0;
  let skipped = 0;
  let failed = 0;
  let stopped = false;

  if (newTracks.length > 0) {
    await destination.init();

    for (const track of newTracks) {
      const label = `${track.artists.join(", ")} - ${track.name}`;
      try {
        const outcome = await destination.mirror(track);
        synced.add(track.id);
        if (outcome === "added") added++;
        else skipped++;
      } catch (err) {
        if (err instanceof DestinationStop) {
          stopped = true;
          logger.warn(`[${destination.name}] ${err.message}`);
          break;
        }
        // Leave the track unmarked so it is retried on the next pass.
        failed++;
        logger.error(`[${destination.name}] Failed to mirror track`, err, { label });
      }
    }

    await persist();
  }

  return {
    destination: destination.name,
    newTracks: newTracks.length,
    added,
    skipped,
    failed,
    stopped,
  };
}
