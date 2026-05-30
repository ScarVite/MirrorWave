"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeSpotify = authorizeSpotify;
const pkce_1 = require("../oauth/pkce");
const loopback_1 = require("../oauth/loopback");
const store_1 = require("../store");
const logger_1 = require("../utils/logger");
const client_1 = require("./client");
/**
 * Runs the Spotify Authorization Code flow:
 * prints a URL, captures the redirect on the loopback server, exchanges the
 * code for tokens, and persists them.
 */
async function authorizeSpotify(config) {
    const api = (0, client_1.buildSpotifyApi)(config);
    const state = (0, pkce_1.randomState)();
    const url = api.createAuthorizeURL(config.spotify.scopes, state, true);
    console.log("\n[Spotify] Open this URL in your browser to authorize:\n");
    console.log(`  ${url}\n`);
    const { code } = await (0, loopback_1.waitForRedirect)(config.spotify.redirectUri, state);
    const { body } = await api.authorizationCodeGrant(code);
    await (0, store_1.updateTokens)({
        spotify: {
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
            expiresAt: Date.now() + body.expires_in * 1000,
        },
    });
    logger_1.logger.info("Spotify authorized successfully");
    console.log("[Spotify] Authorized and tokens saved.\n");
}
