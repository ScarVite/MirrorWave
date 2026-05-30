"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistTracks = getPlaylistTracks;
const PAGE_SIZE = 100;
/**
 * Fetches every (non-local, non-null) track in a Spotify playlist,
 * paginating through the full list.
 */
async function getPlaylistTracks(api, playlistId) {
    const tracks = [];
    let offset = 0;
    for (;;) {
        const { body } = await api.getPlaylistTracks(playlistId, {
            offset,
            limit: PAGE_SIZE,
        });
        for (const item of body.items) {
            const track = item.track;
            if (!track || !("id" in track) || !track.id)
                continue;
            tracks.push({
                id: track.id,
                name: track.name,
                artists: track.artists.map((a) => a.name),
                isrc: track.external_ids?.isrc,
                isLocal: Boolean(track.is_local),
            });
        }
        if (!body.next)
            break;
        offset += PAGE_SIZE;
    }
    return tracks;
}
