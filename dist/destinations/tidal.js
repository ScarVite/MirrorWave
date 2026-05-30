"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TidalDestination = void 0;
const catalog_1 = require("../tidal/catalog");
const client_1 = require("../tidal/client");
const logger_1 = require("../utils/logger");
/** Tidal destination: matches tracks by ISRC and adds them to a playlist. */
class TidalDestination {
    config;
    name = "tidal";
    client;
    constructor(config) {
        this.config = config;
    }
    async init() {
        this.client = await (0, client_1.getTidalClient)(this.config);
    }
    async mirror(track) {
        const label = `${track.artists.join(", ")} - ${track.name}`;
        if (!this.client)
            throw new Error("Tidal destination not initialized");
        if (track.isLocal || !track.isrc) {
            logger_1.logger.warn("[tidal] Skipping track without usable ISRC", { label });
            return "skipped";
        }
        const tidalId = await (0, catalog_1.findTidalTrackIdByIsrc)(this.client, this.config, track.isrc);
        if (!tidalId) {
            logger_1.logger.warn("[tidal] No match found", { label, isrc: track.isrc });
            return "skipped";
        }
        await (0, catalog_1.addTrackToTidalPlaylist)(this.client, this.config, tidalId);
        logger_1.logger.info("[tidal] Mirrored track", { label, tidalId });
        return "added";
    }
}
exports.TidalDestination = TidalDestination;
