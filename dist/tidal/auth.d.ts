import type { TidalConfig } from "../config";
/**
 * Runs the Tidal Authorization Code + PKCE flow and persists the tokens.
 */
export declare function authorizeTidal(tidal: TidalConfig): Promise<void>;
/**
 * Returns a valid Tidal access token, refreshing it when needed.
 * Throws if Tidal has not been authorized yet.
 */
export declare function getValidTidalAccessToken(tidal: TidalConfig): Promise<string>;
