import type { YouTubeConfig } from "../config";
import { waitForRedirect } from "../oauth/loopback";
import { randomState } from "../oauth/pkce";
import { updateTokens } from "../store";
import { logger } from "../utils/logger";
import { buildOAuthClient } from "./client";

/**
 * Runs the Google OAuth Authorization Code flow for the YouTube Data API and
 * persists the resulting tokens (including the long-lived refresh token).
 */
export async function authorizeYouTube(yt: YouTubeConfig): Promise<void> {
  const oauth = buildOAuthClient(yt);
  const state = randomState();
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force a refresh_token to be returned
    scope: yt.scopes,
    state,
  });

  console.log("\n[YouTube] Open this URL in your browser to authorize:\n");
  console.log(`  ${url}\n`);

  const { code } = await waitForRedirect(yt.redirectUri, state);
  const { tokens } = await oauth.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "YouTube did not return a refresh token. Remove the app's access at " +
        "https://myaccount.google.com/permissions and try again.",
    );
  }

  await updateTokens({
    youtube: {
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ?? Date.now(),
    },
  });

  logger.info("YouTube authorized successfully");
  console.log("[YouTube] Authorized and tokens saved.\n");
}
