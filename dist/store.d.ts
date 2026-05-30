export interface OAuthToken {
    accessToken: string;
    refreshToken: string;
    /** Epoch milliseconds at which the access token expires. */
    expiresAt: number;
}
export interface TokenStore {
    spotify?: OAuthToken;
    tidal?: OAuthToken;
    youtube?: OAuthToken;
}
export interface SyncState {
    /** Per-destination set of Spotify track ids already mirrored there. */
    synced: Record<string, string[]>;
    /** Legacy field (single-destination Tidal); migrated into `synced.tidal`. */
    syncedSpotifyTrackIds?: string[];
    /** Legacy field; retained for backwards compatibility. */
    initialized?: boolean;
}
export declare function loadTokens(): Promise<TokenStore>;
export declare function saveTokens(tokens: TokenStore): Promise<void>;
export declare function updateTokens(patch: Partial<TokenStore>): Promise<TokenStore>;
export declare function loadState(): Promise<SyncState>;
export declare function saveState(state: SyncState): Promise<void>;
/** Returns the set of already-synced Spotify track ids for a destination. */
export declare function syncedSetFor(state: SyncState, destination: string): Set<string>;
/** Whether a destination has any persisted progress yet. */
export declare function hasProgress(state: SyncState, destination: string): boolean;
