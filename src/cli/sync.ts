import "dotenv/config";
import { loadConfig } from "../config";
import { initSentry } from "../utils/logger";
import { runSync } from "../sync";

/** Runs a single sync pass and exits. Useful for an external scheduler. */
async function main(): Promise<void> {
  initSentry();
  const config = loadConfig();
  const result = await runSync(config);
  console.log(`Sync complete (${result.total} tracks in playlist):`);
  for (const d of result.destinations) {
    console.log(
      `  ${d.destination}: ${d.added} added, ${d.skipped} skipped, ` +
        `${d.failed} failed (${d.newTracks} new)${d.stopped ? " [stopped early]" : ""}.`,
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
