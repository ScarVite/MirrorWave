"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeYouTube = authorizeYouTube;
const loopback_1 = require("../oauth/loopback");
const pkce_1 = require("../oauth/pkce");
const store_1 = require("../store");
const logger_1 = require("../utils/logger");
const client_1 = require("./client");
/**
 * Runs the Google OAuth Authorization Code flow for the YouTube Data API and
 * persists the resulting tokens (including the long-lived refresh token).
 */
async function authorizeYouTube(yt) {
    const oauth = (0, client_1.buildOAuthClient)(yt);
    const state = (0, pkce_1.randomState)();
    const url = oauth.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // force a refresh_token to be returned
        scope: yt.scopes,
        state,
    });
    console.log("\n[YouTube] Open this URL in your browser to authorize:\n");
    console.log(`  ${url}\n`);
    const { code } = await (0, loopback_1.waitForRedirect)(yt.redirectUri, state);
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) {
        throw new Error("YouTube did not return a refresh token. Remove the app's access at " +
            "https://myaccount.google.com/permissions and try again.");
    }
    await (0, store_1.updateTokens)({
        youtube: {
            accessToken: tokens.access_token ?? "",
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expiry_date ?? Date.now(),
        },
    });
    logger_1.logger.info("YouTube authorized successfully");
    console.log("[YouTube] Authorized and tokens saved.\n");
}
