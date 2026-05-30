"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeTidal = authorizeTidal;
exports.getValidTidalAccessToken = getValidTidalAccessToken;
const pkce_1 = require("../oauth/pkce");
const loopback_1 = require("../oauth/loopback");
const store_1 = require("../store");
const logger_1 = require("../utils/logger");
const AUTHORIZE_URL = "https://login.tidal.com/authorize";
const TOKEN_URL = "https://auth.tidal.com/v1/oauth2/token";
/** Performs a token endpoint request, applying Basic auth when a secret is set. */
async function tokenRequest(tidal, params) {
    const body = new URLSearchParams({
        client_id: tidal.clientId,
        ...params,
    });
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (tidal.clientSecret) {
        const basic = Buffer.from(`${tidal.clientId}:${tidal.clientSecret}`).toString("base64");
        headers.Authorization = `Basic ${basic}`;
    }
    const res = await fetch(TOKEN_URL, { method: "POST", headers, body });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Tidal token request failed (${res.status}): ${text}`);
    }
    return JSON.parse(text);
}
/**
 * Runs the Tidal Authorization Code + PKCE flow and persists the tokens.
 */
async function authorizeTidal(tidal) {
    const { verifier, challenge } = (0, pkce_1.createPkcePair)();
    const state = (0, pkce_1.randomState)();
    const authUrl = new URL(AUTHORIZE_URL);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", tidal.clientId);
    authUrl.searchParams.set("redirect_uri", tidal.redirectUri);
    authUrl.searchParams.set("scope", tidal.scopes.join(" "));
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("state", state);
    console.log("\n[Tidal] Open this URL in your browser to authorize:\n");
    console.log(`  ${authUrl.toString()}\n`);
    const { code } = await (0, loopback_1.waitForRedirect)(tidal.redirectUri, state);
    const token = await tokenRequest(tidal, {
        grant_type: "authorization_code",
        code,
        redirect_uri: tidal.redirectUri,
        code_verifier: verifier,
    });
    if (!token.refresh_token) {
        throw new Error("Tidal did not return a refresh token.");
    }
    await (0, store_1.updateTokens)({
        tidal: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: Date.now() + token.expires_in * 1000,
        },
    });
    logger_1.logger.info("Tidal authorized successfully");
    console.log("[Tidal] Authorized and tokens saved.\n");
}
/**
 * Returns a valid Tidal access token, refreshing it when needed.
 * Throws if Tidal has not been authorized yet.
 */
async function getValidTidalAccessToken(tidal) {
    const tokens = await (0, store_1.loadTokens)();
    if (!tokens.tidal?.refreshToken) {
        throw new Error("Tidal is not authorized yet. Run `npm run auth` (or `npm run auth -- tidal`).");
    }
    const expiresSoon = tokens.tidal.expiresAt - Date.now() < 60_000;
    if (!expiresSoon && tokens.tidal.accessToken) {
        return tokens.tidal.accessToken;
    }
    logger_1.logger.debug("Refreshing Tidal access token");
    const token = await tokenRequest(tidal, {
        grant_type: "refresh_token",
        refresh_token: tokens.tidal.refreshToken,
    });
    const updated = await (0, store_1.updateTokens)({
        tidal: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token ?? tokens.tidal.refreshToken,
            expiresAt: Date.now() + token.expires_in * 1000,
        },
    });
    return updated.tidal.accessToken;
}
