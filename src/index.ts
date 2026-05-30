import "dotenv/config";
import * as schedule from "node-schedule";
import { loadConfig, type Config } from "./config";
import { loadTokens } from "./store";
import { runSync } from "./sync";
import { initSentry, logger } from "./utils/logger";

let running = false;

/** Runs a sync pass, guarding against overlapping executions. */
async function tick(config: Config): Promise<void> {
  if (running) {
    logger.warn("Previous sync still running; skipping this tick");
    return;
  }
  running = true;
  try {
    await runSync(config);
  } catch (err) {
    logger.error("Sync pass failed", err);
  } finally {
    running = false;
  }
}

async function main(): Promise<void> {
  initSentry();
  const config = loadConfig();

  const tokens = await loadTokens();
  const missing: string[] = [];
  if (!tokens.spotify?.refreshToken) missing.push("spotify");
  if (config.targets.includes("tidal") && !tokens.tidal?.refreshToken) missing.push("tidal");
  if (config.targets.includes("youtube") && !tokens.youtube?.refreshToken) missing.push("youtube");
  if (missing.length > 0) {
    console.error(
      `Not authorized yet for: ${missing.join(", ")}. Run \`npm run auth\` first.`,
    );
    process.exit(1);
  }

  logger.info("MirrorWave starting", { cron: config.sync.cron });
  console.log(
    `MirrorWave running. Watching Spotify playlist on schedule "${config.sync.cron}".`,
  );

  schedule.scheduleJob(config.sync.cron, () => void tick(config));

  if (config.sync.runOnStartup) {
    await tick(config);
  }

  const shutdown = async () => {
    logger.info("Shutting down");
    await schedule.gracefulShutdown();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
