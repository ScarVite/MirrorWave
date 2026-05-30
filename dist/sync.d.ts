import type { Config } from "./config";
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
export declare function runSync(config: Config): Promise<SyncResult>;
