import type { TidalConfig } from "../config";
import type { SpotifyTrack } from "../spotify/playlist";
import {
  addTrackToTidalPlaylist,
  findTidalTrackIdByIsrc,
} from "../tidal/catalog";
import { getTidalClient, type TidalClient } from "../tidal/client";
import { logger } from "../utils/logger";
import type { Destination, MirrorOutcome } from "./types";

/** Tidal destination: matches tracks by ISRC and adds them to a playlist. */
export class TidalDestination implements Destination {
  readonly name = "tidal";
  private client?: TidalClient;

  constructor(private readonly config: TidalConfig) {}

  async init(): Promise<void> {
    this.client = await getTidalClient(this.config);
  }

  async mirror(track: SpotifyTrack): Promise<MirrorOutcome> {
    const label = `${track.artists.join(", ")} - ${track.name}`;
    if (!this.client) throw new Error("Tidal destination not initialized");

    if (track.isLocal || !track.isrc) {
      logger.warn("[tidal] Skipping track without usable ISRC", { label });
      return "skipped";
    }

    const tidalId = await findTidalTrackIdByIsrc(
      this.client,
      this.config,
      track.isrc,
    );
    if (!tidalId) {
      logger.warn("[tidal] No match found", { label, isrc: track.isrc });
      return "skipped";
    }

    await addTrackToTidalPlaylist(this.client, this.config, tidalId);
    logger.info("[tidal] Mirrored track", { label, tidalId });
    return "added";
  }
}
