import type SpotifyWebApi from "spotify-web-api-node";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  isrc?: string;
  isLocal: boolean;
}

const PAGE_SIZE = 100;

/**
 * Fetches every (non-local, non-null) track in a Spotify playlist,
 * paginating through the full list.
 */
export async function getPlaylistTracks(
  api: SpotifyWebApi,
  playlistId: string,
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let offset = 0;

  for (;;) {
    const { body } = await api.getPlaylistTracks(playlistId, {
      offset,
      limit: PAGE_SIZE,
    });

    for (const item of body.items) {
      const track = item.track;
      if (!track || !("id" in track) || !track.id) continue;
      tracks.push({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name),
        isrc: track.external_ids?.isrc,
        isLocal: Boolean(track.is_local),
      });
    }

    if (!body.next) break;
    offset += PAGE_SIZE;
  }

  return tracks;
}
