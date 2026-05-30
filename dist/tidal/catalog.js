"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIsrc = normalizeIsrc;
exports.findTidalTrackIdByIsrc = findTidalTrackIdByIsrc;
exports.addTrackToTidalPlaylist = addTrackToTidalPlaylist;
/**
 * Normalizes an ISRC to the canonical 12-character form Tidal expects
 * (uppercase, no separators), or returns null if it is not a valid ISRC.
 * Pattern: CC (country) + XXX (registrant) + YY (year) + NNNNN (designation).
 */
function normalizeIsrc(isrc) {
    const cleaned = isrc.replace(/[\s-]/g, "").toUpperCase();
    return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(cleaned) ? cleaned : null;
}
/**
 * Looks up a Tidal track id by its ISRC. Returns the first match, or null
 * (including when the ISRC is malformed and cannot be queried).
 */
async function findTidalTrackIdByIsrc(client, tidal, isrc) {
    const normalized = normalizeIsrc(isrc);
    if (!normalized)
        return null;
    const { data, error } = await client.GET("/tracks", {
        params: {
            query: {
                countryCode: tidal.countryCode,
                "filter[isrc]": [normalized],
            },
        },
    });
    if (error) {
        throw new Error(`Tidal ISRC lookup failed: ${JSON.stringify(error)}`);
    }
    const first = data?.data?.[0];
    return first?.id ?? null;
}
/**
 * Adds a track to a Tidal playlist via the items relationship endpoint.
 */
async function addTrackToTidalPlaylist(client, tidal, trackId) {
    const { error } = await client.POST("/playlists/{id}/relationships/items", {
        params: {
            path: { id: tidal.playlistId },
            query: { countryCode: tidal.countryCode },
        },
        body: {
            data: [{ id: trackId, type: "tracks" }],
        },
    });
    if (error) {
        throw new Error(`Tidal add-to-playlist failed: ${JSON.stringify(error)}`);
    }
}
