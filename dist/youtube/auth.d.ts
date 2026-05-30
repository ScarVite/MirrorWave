import type { YouTubeConfig } from "../config";
/**
 * Runs the Google OAuth Authorization Code flow for the YouTube Data API and
 * persists the resulting tokens (including the long-lived refresh token).
 */
export declare function authorizeYouTube(yt: YouTubeConfig): Promise<void>;
