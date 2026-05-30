import type { YouTubeConfig } from "../config";
import type { SpotifyTrack } from "../spotify/playlist";
import { type Destination, type MirrorOutcome } from "./types";
/**
 * YouTube Music destination via the official YouTube Data API v3.
 * There is no ISRC lookup, so tracks are matched by a text search of
 * "artists - title" and the top video result is added to the playlist.
 */
export declare class YouTubeDestination implements Destination {
    private readonly config;
    readonly name = "youtube";
    private yt?;
    private addsThisRun;
    constructor(config: YouTubeConfig);
    init(): Promise<void>;
    mirror(track: SpotifyTrack): Promise<MirrorOutcome>;
}
