import type { TidalConfig } from "../config";
import { getValidTidalAccessToken } from "./auth";

/**
 * Native dynamic import that survives TypeScript's CommonJS downleveling.
 * Without this, `import()` is compiled to `require()`, which throws
 * ERR_REQUIRE_ESM for the ESM-only @tidal-music/api package.
 */
const dynamicImport = new Function(
  "specifier",
  "return import(specifier)",
) as (specifier: string) => Promise<any>;

/**
 * Minimal structural type for the bits of the openapi-fetch client we use.
 * Avoids a hard type dependency on @tidal-music/common.
 */
export interface TidalClient {
  GET(
    path: string,
    init?: unknown,
  ): Promise<{ data?: any; error?: any; response: Response }>;
  POST(
    path: string,
    init?: unknown,
  ): Promise<{ data?: any; error?: any; response: Response }>;
}

/**
 * Credentials provider compatible with @tidal-music/common's CredentialsProvider.
 * getCredentials is called by the API client on every request, so it always
 * returns a freshly-refreshed access token.
 */
function createCredentialsProvider(tidal: TidalConfig) {
  return {
    bus: (_callbackFn: (e: unknown) => void) => {
      /* no-op: we don't broadcast credential updates */
    },
    getCredentials: async () => {
      const token = await getValidTidalAccessToken(tidal);
      return {
        clientId: tidal.clientId,
        requestedScopes: tidal.scopes,
        token,
      };
    },
  };
}

/**
 * Builds a Tidal API client. Uses a dynamic import because @tidal-music/api
 * is ESM-only and this project compiles to CommonJS.
 */
export async function getTidalClient(tidal: TidalConfig): Promise<TidalClient> {
  const { createAPIClient } = await dynamicImport("@tidal-music/api");
  const provider = createCredentialsProvider(tidal);
  return createAPIClient(provider as any) as unknown as TidalClient;
}
