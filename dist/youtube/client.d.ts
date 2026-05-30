import { type youtube_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { YouTubeConfig } from "../config";
/** Builds a raw Google OAuth2 client (no credentials attached). */
export declare function buildOAuthClient(yt: YouTubeConfig): OAuth2Client;
/**
 * Returns a YouTube Data API client authenticated with the stored refresh
 * token. The OAuth client refreshes access tokens automatically and we persist
 * any updated tokens via the "tokens" event.
 * Throws if YouTube has not been authorized yet.
 */
export declare function getAuthorizedYouTube(yt: YouTubeConfig): Promise<youtube_v3.Youtube>;
