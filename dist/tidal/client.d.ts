import type { TidalConfig } from "../config";
/**
 * Minimal structural type for the bits of the openapi-fetch client we use.
 * Avoids a hard type dependency on @tidal-music/common.
 */
export interface TidalClient {
    GET(path: string, init?: unknown): Promise<{
        data?: any;
        error?: any;
        response: Response;
    }>;
    POST(path: string, init?: unknown): Promise<{
        data?: any;
        error?: any;
        response: Response;
    }>;
}
/**
 * Builds a Tidal API client. Uses a dynamic import because @tidal-music/api
 * is ESM-only and this project compiles to CommonJS.
 */
export declare function getTidalClient(tidal: TidalConfig): Promise<TidalClient>;
