import type { SpotifyTrack } from "../spotify/playlist";
export type MirrorOutcome = "added" | "skipped";
/**
 * Thrown by a destination when it cannot continue this pass (e.g. API quota
 * exhausted). The orchestrator stops processing that destination and persists
 * progress so the remaining tracks are retried on the next run.
 */
export declare class DestinationStop extends Error {
}
/**
 * A sync destination (e.g. Tidal, YouTube Music). `mirror` either adds the
 * track and returns "added", returns "skipped" when there is no usable match,
 * throws a normal Error for a transient failure (retried next pass), or throws
 * DestinationStop to abort the rest of this pass for this destination.
 */
export interface Destination {
    readonly name: string;
    /** Prepare the client/auth. Called once before the first mirror. */
    init(): Promise<void>;
    mirror(track: SpotifyTrack): Promise<MirrorOutcome>;
}
