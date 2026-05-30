"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDestinations = buildDestinations;
const tidal_1 = require("./tidal");
const youtube_1 = require("./youtube");
/** Builds the enabled destination instances from config, in target order. */
function buildDestinations(config) {
    const destinations = [];
    for (const target of config.targets) {
        if (target === "tidal" && config.tidal) {
            destinations.push(new tidal_1.TidalDestination(config.tidal));
        }
        else if (target === "youtube" && config.youtube) {
            destinations.push(new youtube_1.YouTubeDestination(config.youtube));
        }
    }
    return destinations;
}
