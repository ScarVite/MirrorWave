import type { TidalConfig } from "../config";
import type { SpotifyTrack } from "../spotify/playlist";
import type { Destination, MirrorOutcome } from "./types";
/** Tidal destination: matches tracks by ISRC and adds them to a playlist. */
export declare class TidalDestination implements Destination {
    private readonly config;
    readonly name = "tidal";
    private client?;
    constructor(config: TidalConfig);
    init(): Promise<void>;
    mirror(track: SpotifyTrack): Promise<MirrorOutcome>;
}
