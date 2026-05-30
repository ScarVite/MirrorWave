"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeDestination = void 0;
const client_1 = require("../youtube/client");
const logger_1 = require("../utils/logger");
const types_1 = require("./types");
/** Returns true if a Google API error is a quota-exhaustion error. */
function isQuotaError(err) {
    const reason = err?.errors?.[0]?.reason ?? err?.response?.data?.error?.errors?.[0]?.reason;
    return err?.code === 403 && (reason === "quotaExceeded" || reason === "dailyLimitExceeded");
}
/**
 * YouTube Music destination via the official YouTube Data API v3.
 * There is no ISRC lookup, so tracks are matched by a text search of
 * "artists - title" and the top video result is added to the playlist.
 */
class YouTubeDestination {
    config;
    name = "youtube";
    yt;
    addsThisRun = 0;
    constructor(config) {
        this.config = config;
    }
    async init() {
        this.addsThisRun = 0;
        this.yt = await (0, client_1.getAuthorizedYouTube)(this.config);
    }
    async mirror(track) {
        if (!this.yt)
            throw new Error("YouTube destination not initialized");
        const label = `${track.artists.join(", ")} - ${track.name}`;
        if (this.addsThisRun >= this.config.maxAddsPerRun) {
            throw new types_1.DestinationStop(`Reached YOUTUBE_MAX_ADDS_PER_RUN (${this.config.maxAddsPerRun}); resuming next run.`);
        }
        try {
            const query = `${track.artists.join(" ")} ${track.name}`.trim();
            const search = await this.yt.search.list({
                part: ["snippet"],
                q: query,
                type: ["video"],
                maxResults: 1,
            });
            const videoId = search.data.items?.[0]?.id?.videoId;
            if (!videoId) {
                logger_1.logger.warn("[youtube] No match found", { label });
                return "skipped";
            }
            await this.yt.playlistItems.insert({
                part: ["snippet"],
                requestBody: {
                    snippet: {
                        playlistId: this.config.playlistId,
                        resourceId: { kind: "youtube#video", videoId },
                    },
                },
            });
            this.addsThisRun++;
            logger_1.logger.info("[youtube] Mirrored track", { label, videoId });
            return "added";
        }
        catch (err) {
            if (isQuotaError(err)) {
                throw new types_1.DestinationStop("YouTube API daily quota exhausted; resuming next run.");
            }
            throw err;
        }
    }
}
exports.YouTubeDestination = YouTubeDestination;
