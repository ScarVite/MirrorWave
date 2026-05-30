"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOAuthClient = buildOAuthClient;
exports.getAuthorizedYouTube = getAuthorizedYouTube;
const googleapis_1 = require("googleapis");
const store_1 = require("../store");
/** Builds a raw Google OAuth2 client (no credentials attached). */
function buildOAuthClient(yt) {
    return new googleapis_1.google.auth.OAuth2(yt.clientId, yt.clientSecret, yt.redirectUri);
}
/**
 * Returns a YouTube Data API client authenticated with the stored refresh
 * token. The OAuth client refreshes access tokens automatically and we persist
 * any updated tokens via the "tokens" event.
 * Throws if YouTube has not been authorized yet.
 */
async function getAuthorizedYouTube(yt) {
    const tokens = await (0, store_1.loadTokens)();
    if (!tokens.youtube?.refreshToken) {
        throw new Error("YouTube is not authorized yet. Run `npm run auth` (or `npm run auth -- youtube`).");
    }
    const oauth = buildOAuthClient(yt);
    oauth.setCredentials({
        refresh_token: tokens.youtube.refreshToken,
        access_token: tokens.youtube.accessToken,
        expiry_date: tokens.youtube.expiresAt,
    });
    oauth.on("tokens", (t) => {
        void (0, store_1.updateTokens)({
            youtube: {
                accessToken: t.access_token ?? tokens.youtube.accessToken,
                refreshToken: t.refresh_token ?? tokens.youtube.refreshToken,
                expiresAt: t.expiry_date ?? tokens.youtube.expiresAt,
            },
        });
    });
    return googleapis_1.google.youtube({ version: "v3", auth: oauth });
}
