import type { Config } from "../config";
import { randomState } from "../oauth/pkce";
import { waitForRedirect } from "../oauth/loopback";
import { updateTokens } from "../store";
import { logger } from "../utils/logger";
import { buildSpotifyApi } from "./client";

/**
 * Runs the Spotify Authorization Code flow:
 * prints a URL, captures the redirect on the loopback server, exchanges the
 * code for tokens, and persists them.
 */
export async function authorizeSpotify(config: Config): Promise<void> {
  const api = buildSpotifyApi(config);
  const state = randomState();
  const url = api.createAuthorizeURL(config.spotify.scopes, state, true);

  console.log("\n[Spotify] Open this URL in your browser to authorize:\n");
  console.log(`  ${url}\n`);

  const { code } = await waitForRedirect(config.spotify.redirectUri, state);

  const { body } = await api.authorizationCodeGrant(code);
  await updateTokens({
    spotify: {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + body.expires_in * 1000,
    },
  });

  logger.info("Spotify authorized successfully");
  console.log("[Spotify] Authorized and tokens saved.\n");
}
