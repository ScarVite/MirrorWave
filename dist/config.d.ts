import "dotenv/config";
export type DestinationName = "tidal" | "youtube";
export interface TidalConfig {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    playlistId: string;
    countryCode: string;
    scopes: string[];
}
export interface YouTubeConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    playlistId: string;
    /** Max additions per sync pass, to stay within the daily API quota. */
    maxAddsPerRun: number;
    scopes: string[];
}
export interface Config {
    spotify: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        playlistId: string;
        scopes: string[];
    };
    /** Enabled destinations, in order. */
    targets: DestinationName[];
    tidal?: TidalConfig;
    youtube?: YouTubeConfig;
    sync: {
        cron: string;
        syncExistingOnFirstRun: boolean;
        runOnStartup: boolean;
    };
}
/**
 * Loads and validates configuration from the environment.
 * Throws if a required value is missing.
 */
export declare function loadConfig(): Config;
