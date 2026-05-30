"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTidalClient = getTidalClient;
const auth_1 = require("./auth");
/**
 * Native dynamic import that survives TypeScript's CommonJS downleveling.
 * Without this, `import()` is compiled to `require()`, which throws
 * ERR_REQUIRE_ESM for the ESM-only @tidal-music/api package.
 */
const dynamicImport = new Function("specifier", "return import(specifier)");
/**
 * Credentials provider compatible with @tidal-music/common's CredentialsProvider.
 * getCredentials is called by the API client on every request, so it always
 * returns a freshly-refreshed access token.
 */
function createCredentialsProvider(tidal) {
    return {
        bus: (_callbackFn) => {
            /* no-op: we don't broadcast credential updates */
        },
        getCredentials: async () => {
            const token = await (0, auth_1.getValidTidalAccessToken)(tidal);
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
async function getTidalClient(tidal) {
    const { createAPIClient } = await dynamicImport("@tidal-music/api");
    const provider = createCredentialsProvider(tidal);
    return createAPIClient(provider);
}
