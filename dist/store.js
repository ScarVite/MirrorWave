"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTokens = loadTokens;
exports.saveTokens = saveTokens;
exports.updateTokens = updateTokens;
exports.loadState = loadState;
exports.saveState = saveState;
exports.syncedSetFor = syncedSetFor;
exports.hasProgress = hasProgress;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const DATA_DIR = path.resolve(process.cwd(), ".mirrorwave");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
async function ensureDir() {
    await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
}
async function readJson(file, fallback) {
    try {
        const raw = await fs_1.promises.readFile(file, "utf8");
        return JSON.parse(raw);
    }
    catch (err) {
        if (err?.code === "ENOENT")
            return fallback;
        throw err;
    }
}
async function writeJson(file, data) {
    await ensureDir();
    const tmp = `${file}.tmp`;
    await fs_1.promises.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs_1.promises.rename(tmp, file);
}
async function loadTokens() {
    return readJson(TOKENS_FILE, {});
}
async function saveTokens(tokens) {
    await writeJson(TOKENS_FILE, tokens);
}
async function updateTokens(patch) {
    const current = await loadTokens();
    const merged = { ...current, ...patch };
    await saveTokens(merged);
    return merged;
}
async function loadState() {
    const raw = await readJson(STATE_FILE, { synced: {} });
    const synced = { ...(raw.synced ?? {}) };
    // Migrate legacy single-destination state into the per-destination shape.
    if (!synced.tidal && Array.isArray(raw.syncedSpotifyTrackIds)) {
        synced.tidal = raw.syncedSpotifyTrackIds;
    }
    return { synced };
}
async function saveState(state) {
    // Persist only the current shape (drop legacy fields once migrated).
    await writeJson(STATE_FILE, { synced: state.synced });
}
/** Returns the set of already-synced Spotify track ids for a destination. */
function syncedSetFor(state, destination) {
    return new Set(state.synced[destination] ?? []);
}
/** Whether a destination has any persisted progress yet. */
function hasProgress(state, destination) {
    return Array.isArray(state.synced[destination]);
}
