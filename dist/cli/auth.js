"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const auth_1 = require("../spotify/auth");
const auth_2 = require("../tidal/auth");
const auth_3 = require("../youtube/auth");
/**
 * Interactive one-time authorization.
 * Usage:
 *   npm run auth            # authorize Spotify + every enabled destination
 *   npm run auth -- spotify # authorize only Spotify
 *   npm run auth -- tidal   # authorize only Tidal
 *   npm run auth -- youtube # authorize only YouTube
 */
async function main() {
    const config = (0, config_1.loadConfig)();
    const args = process.argv.slice(2).map((a) => a.toLowerCase());
    const targets = args.length > 0 ? args : ["spotify", ...config.targets];
    for (const target of targets) {
        if (target === "spotify") {
            await (0, auth_1.authorizeSpotify)(config);
        }
        else if (target === "tidal") {
            if (!config.tidal)
                throw new Error("Tidal is not an enabled target (SYNC_TARGETS).");
            await (0, auth_2.authorizeTidal)(config.tidal);
        }
        else if (target === "youtube") {
            if (!config.youtube)
                throw new Error("YouTube is not an enabled target (SYNC_TARGETS).");
            await (0, auth_3.authorizeYouTube)(config.youtube);
        }
        else {
            console.error(`Unknown auth target: "${target}" (use "spotify", "tidal", or "youtube")`);
            process.exitCode = 1;
            return;
        }
    }
    console.log("Done. You can now run `npm run sync` or `npm start`.");
}
main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
