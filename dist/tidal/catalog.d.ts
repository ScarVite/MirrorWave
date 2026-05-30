import type { TidalConfig } from "../config";
import type { TidalClient } from "./client";
/**
 * Normalizes an ISRC to the canonical 12-character form Tidal expects
 * (uppercase, no separators), or returns null if it is not a valid ISRC.
 * Pattern: CC (country) + XXX (registrant) + YY (year) + NNNNN (designation).
 */
export declare function normalizeIsrc(isrc: string): string | null;
/**
 * Looks up a Tidal track id by its ISRC. Returns the first match, or null
 * (including when the ISRC is malformed and cannot be queried).
 */
export declare function findTidalTrackIdByIsrc(client: TidalClient, tidal: TidalConfig, isrc: string): Promise<string | null>;
/**
 * Adds a track to a Tidal playlist via the items relationship endpoint.
 */
export declare function addTrackToTidalPlaylist(client: TidalClient, tidal: TidalConfig, trackId: string): Promise<void>;
