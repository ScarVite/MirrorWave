import SpotifyWebApi from "spotify-web-api-node";
import type { Config } from "../config";
/** Builds a raw SpotifyWebApi instance (no tokens attached). */
export declare function buildSpotifyApi(config: Config): SpotifyWebApi;
/**
 * Returns a SpotifyWebApi authenticated with the stored user tokens,
 * refreshing the access token when it is missing or close to expiry.
 * Throws if the user has not authorized yet (run `npm run auth`).
 */
export declare function getAuthorizedSpotifyApi(config: Config): Promise<SpotifyWebApi>;
