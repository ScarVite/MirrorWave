"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
require("dotenv/config");
function required(name) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}. ` +
            `Copy .env.example to .env and fill it in.`);
    }
    return value.trim();
}
function optional(name, fallback) {
    const value = process.env[name];
    return value && value.trim() !== "" ? value.trim() : fallback;
}
function bool(name, fallback) {
    const value = process.env[name];
    if (value === undefined || value.trim() === "")
        return fallback;
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
function num(name, fallback) {
    const value = process.env[name];
    if (value === undefined || value.trim() === "")
        return fallback;
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : fallback;
}
function parseTargets() {
    const raw = optional("SYNC_TARGETS", "tidal,youtube");
    const targets = raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    const valid = [];
    for (const t of targets) {
        if (t === "tidal" || t === "youtube")
            valid.push(t);
        else
            throw new Error(`Unknown sync target "${t}" in SYNC_TARGETS (use "tidal" and/or "youtube").`);
    }
    if (valid.length === 0)
        throw new Error("SYNC_TARGETS must list at least one destination.");
    return valid;
}
function loadTidalConfig() {
    return {
        clientId: required("TIDAL_CLIENT_ID"),
        clientSecret: process.env.TIDAL_CLIENT_SECRET?.trim() || undefined,
        redirectUri: optional("TIDAL_REDIRECT_URI", "http://127.0.0.1:8889/callback"),
        playlistId: required("TIDAL_PLAYLIST_ID"),
        countryCode: optional("TIDAL_COUNTRY_CODE", "US"),
        scopes: ["user.read", "playlists.read", "playlists.write"],
    };
}
function loadYouTubeConfig() {
    return {
        clientId: required("YOUTUBE_CLIENT_ID"),
        clientSecret: required("YOUTUBE_CLIENT_SECRET"),
        redirectUri: optional("YOUTUBE_REDIRECT_URI", "http://127.0.0.1:8890/callback"),
        playlistId: required("YOUTUBE_PLAYLIST_ID"),
        maxAddsPerRun: num("YOUTUBE_MAX_ADDS_PER_RUN", 50),
        scopes: ["https://www.googleapis.com/auth/youtube"],
    };
}
/**
 * Loads and validates configuration from the environment.
 * Throws if a required value is missing.
 */
function loadConfig() {
    const targets = parseTargets();
    return {
        spotify: {
            clientId: required("SPOTIFY_CLIENT_ID"),
            clientSecret: required("SPOTIFY_CLIENT_SECRET"),
            redirectUri: optional("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8888/callback"),
            playlistId: required("SPOTIFY_PLAYLIST_ID"),
            scopes: ["playlist-read-private", "playlist-read-collaborative"],
        },
        targets,
        tidal: targets.includes("tidal") ? loadTidalConfig() : undefined,
        youtube: targets.includes("youtube") ? loadYouTubeConfig() : undefined,
        sync: {
            cron: optional("SYNC_CRON", "*/2 * * * *"),
            syncExistingOnFirstRun: bool("SYNC_EXISTING_ON_FIRST_RUN", true),
            runOnStartup: bool("RUN_ON_STARTUP", true),
        },
    };
}
