import type { youtube_v3 } from "googleapis";
import type { YouTubeConfig } from "../config";
import type { SpotifyTrack } from "../spotify/playlist";
import { getAuthorizedYouTube } from "../youtube/client";
import { logger } from "../utils/logger";
import { DestinationStop, type Destination, type MirrorOutcome } from "./types";

/** Returns true if a Google API error is a quota-exhaustion error. */
function isQuotaError(err: any): boolean {
  const reason = err?.errors?.[0]?.reason ?? err?.response?.data?.error?.errors?.[0]?.reason;
  return err?.code === 403 && (reason === "quotaExceeded" || reason === "dailyLimitExceeded");
}

/**
 * YouTube Music destination via the official YouTube Data API v3.
 * There is no ISRC lookup, so tracks are matched by a text search of
 * "artists - title" and the top video result is added to the playlist.
 */
export class YouTubeDestination implements Destination {
  readonly name = "youtube";
  private yt?: youtube_v3.Youtube;
  private addsThisRun = 0;

  constructor(private readonly config: YouTubeConfig) {}

  async init(): Promise<void> {
    this.addsThisRun = 0;
    this.yt = await getAuthorizedYouTube(this.config);
  }

  async mirror(track: SpotifyTrack): Promise<MirrorOutcome> {
    if (!this.yt) throw new Error("YouTube destination not initialized");
    const label = `${track.artists.join(", ")} - ${track.name}`;

    if (this.addsThisRun >= this.config.maxAddsPerRun) {
      throw new DestinationStop(
        `Reached YOUTUBE_MAX_ADDS_PER_RUN (${this.config.maxAddsPerRun}); resuming next run.`,
      );
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
        logger.warn("[youtube] No match found", { label });
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
      logger.info("[youtube] Mirrored track", { label, videoId });
      return "added";
    } catch (err) {
      if (isQuotaError(err)) {
        throw new DestinationStop(
          "YouTube API daily quota exhausted; resuming next run.",
        );
      }
      throw err;
    }
  }
}
