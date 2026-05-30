import SpotifyWebApi from "spotify-web-api-node";
import type { Config } from "../config";
import { loadTokens, updateTokens } from "../store";
import { logger } from "../utils/logger";

/** Builds a raw SpotifyWebApi instance (no tokens attached). */
export function buildSpotifyApi(config: Config): SpotifyWebApi {
  return new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    redirectUri: config.spotify.redirectUri,
  });
}

/**
 * Returns a SpotifyWebApi authenticated with the stored user tokens,
 * refreshing the access token when it is missing or close to expiry.
 * Throws if the user has not authorized yet (run `npm run auth`).
 */
export async function getAuthorizedSpotifyApi(
  config: Config,
): Promise<SpotifyWebApi> {
  const tokens = await loadTokens();
  if (!tokens.spotify?.refreshToken) {
    throw new Error(
      "Spotify is not authorized yet. Run `npm run auth` (or `npm run auth -- spotify`).",
    );
  }

  const api = buildSpotifyApi(config);
  api.setRefreshToken(tokens.spotify.refreshToken);
  api.setAccessToken(tokens.spotify.accessToken);

  const expiresSoon = tokens.spotify.expiresAt - Date.now() < 60_000;
  if (expiresSoon || !tokens.spotify.accessToken) {
    logger.debug("Refreshing Spotify access token");
    const { body } = await api.refreshAccessToken();
    const accessToken = body.access_token;
    api.setAccessToken(accessToken);
    await updateTokens({
      spotify: {
        accessToken,
        refreshToken: body.refresh_token ?? tokens.spotify.refreshToken,
        expiresAt: Date.now() + body.expires_in * 1000,
      },
    });
  }

  return api;
}
