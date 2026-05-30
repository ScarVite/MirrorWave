import type SpotifyWebApi from "spotify-web-api-node";
export interface SpotifyTrack {
    id: string;
    name: string;
    artists: string[];
    isrc?: string;
    isLocal: boolean;
}
/**
 * Fetches every (non-local, non-null) track in a Spotify playlist,
 * paginating through the full list.
 */
export declare function getPlaylistTracks(api: SpotifyWebApi, playlistId: string): Promise<SpotifyTrack[]>;
