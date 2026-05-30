import type { Config } from "../config";
/**
 * Runs the Spotify Authorization Code flow:
 * prints a URL, captures the redirect on the loopback server, exchanges the
 * code for tokens, and persists them.
 */
export declare function authorizeSpotify(config: Config): Promise<void>;
