"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSync = runSync;
const destinations_1 = require("./destinations");
const types_1 = require("./destinations/types");
const client_1 = require("./spotify/client");
const playlist_1 = require("./spotify/playlist");
const store_1 = require("./store");
const logger_1 = require("./utils/logger");
/**
 * Runs a single sync pass: reads the Spotify playlist once, then mirrors any
 * not-yet-synced tracks to each enabled destination. Progress is tracked
 * per-destination so a track that succeeded on one service but failed on
 * another is retried only where needed.
 */
async function runSync(config) {
    const spotifyApi = await (0, client_1.getAuthorizedSpotifyApi)(config);
    const tracks = await (0, playlist_1.getPlaylistTracks)(spotifyApi, config.spotify.playlistId);
    const destinations = (0, destinations_1.buildDestinations)(config);
    const results = [];
    for (const destination of destinations) {
        results.push(await syncDestination(config, destination, tracks));
    }
    const result = { total: tracks.length, destinations: results };
    logger_1.logger.info("Sync pass complete", { total: tracks.length, results });
    return result;
}
async function syncDestination(config, destination, tracks) {
    const state = await (0, store_1.loadState)();
    const synced = (0, store_1.syncedSetFor)(state, destination.name);
    const firstRun = !(0, store_1.hasProgress)(state, destination.name);
    const persist = async () => {
        const current = await (0, store_1.loadState)();
        current.synced[destination.name] = Array.from(synced);
        await (0, store_1.saveState)(current);
    };
    // First run with baseline mode: mark everything as synced without copying.
    if (firstRun && !config.sync.syncExistingOnFirstRun) {
        for (const t of tracks)
            synced.add(t.id);
        await persist();
        logger_1.logger.info(`[${destination.name}] Baseline established; watching for new additions`, {
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
                if (outcome === "added")
                    added++;
                else
                    skipped++;
            }
            catch (err) {
                if (err instanceof types_1.DestinationStop) {
                    stopped = true;
                    logger_1.logger.warn(`[${destination.name}] ${err.message}`);
                    break;
                }
                // Leave the track unmarked so it is retried on the next pass.
                failed++;
                logger_1.logger.error(`[${destination.name}] Failed to mirror track`, err, { label });
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
