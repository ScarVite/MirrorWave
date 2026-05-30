"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const sync_1 = require("../sync");
/** Runs a single sync pass and exits. Useful for an external scheduler. */
async function main() {
    (0, logger_1.initSentry)();
    const config = (0, config_1.loadConfig)();
    const result = await (0, sync_1.runSync)(config);
    console.log(`Sync complete (${result.total} tracks in playlist):`);
    for (const d of result.destinations) {
        console.log(`  ${d.destination}: ${d.added} added, ${d.skipped} skipped, ` +
            `${d.failed} failed (${d.newTracks} new)${d.stopped ? " [stopped early]" : ""}.`);
    }
}
main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
