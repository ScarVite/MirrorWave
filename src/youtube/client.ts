import { google, type youtube_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { YouTubeConfig } from "../config";
import { loadTokens, updateTokens } from "../store";

/** Builds a raw Google OAuth2 client (no credentials attached). */
export function buildOAuthClient(yt: YouTubeConfig): OAuth2Client {
  return new google.auth.OAuth2(yt.clientId, yt.clientSecret, yt.redirectUri);
}

/**
 * Returns a YouTube Data API client authenticated with the stored refresh
 * token. The OAuth client refreshes access tokens automatically and we persist
 * any updated tokens via the "tokens" event.
 * Throws if YouTube has not been authorized yet.
 */
export async function getAuthorizedYouTube(
  yt: YouTubeConfig,
): Promise<youtube_v3.Youtube> {
  const tokens = await loadTokens();
  if (!tokens.youtube?.refreshToken) {
    throw new Error(
      "YouTube is not authorized yet. Run `npm run auth` (or `npm run auth -- youtube`).",
    );
  }

  const oauth = buildOAuthClient(yt);
  oauth.setCredentials({
    refresh_token: tokens.youtube.refreshToken,
    access_token: tokens.youtube.accessToken,
    expiry_date: tokens.youtube.expiresAt,
  });

  oauth.on("tokens", (t) => {
    void updateTokens({
      youtube: {
        accessToken: t.access_token ?? tokens.youtube!.accessToken,
        refreshToken: t.refresh_token ?? tokens.youtube!.refreshToken,
        expiresAt: t.expiry_date ?? tokens.youtube!.expiresAt,
      },
    });
  });

  return google.youtube({ version: "v3", auth: oauth });
}
