"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSpotifyApi = buildSpotifyApi;
exports.getAuthorizedSpotifyApi = getAuthorizedSpotifyApi;
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const store_1 = require("../store");
const logger_1 = require("../utils/logger");
/** Builds a raw SpotifyWebApi instance (no tokens attached). */
function buildSpotifyApi(config) {
    return new spotify_web_api_node_1.default({
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
async function getAuthorizedSpotifyApi(config) {
    const tokens = await (0, store_1.loadTokens)();
    if (!tokens.spotify?.refreshToken) {
        throw new Error("Spotify is not authorized yet. Run `npm run auth` (or `npm run auth -- spotify`).");
    }
    const api = buildSpotifyApi(config);
    api.setRefreshToken(tokens.spotify.refreshToken);
    api.setAccessToken(tokens.spotify.accessToken);
    const expiresSoon = tokens.spotify.expiresAt - Date.now() < 60_000;
    if (expiresSoon || !tokens.spotify.accessToken) {
        logger_1.logger.debug("Refreshing Spotify access token");
        const { body } = await api.refreshAccessToken();
        const accessToken = body.access_token;
        api.setAccessToken(accessToken);
        await (0, store_1.updateTokens)({
            spotify: {
                accessToken,
                refreshToken: body.refresh_token ?? tokens.spotify.refreshToken,
                expiresAt: Date.now() + body.expires_in * 1000,
            },
        });
    }
    return api;
}
