"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const schedule = __importStar(require("node-schedule"));
const config_1 = require("./config");
const store_1 = require("./store");
const sync_1 = require("./sync");
const logger_1 = require("./utils/logger");
let running = false;
/** Runs a sync pass, guarding against overlapping executions. */
async function tick(config) {
    if (running) {
        logger_1.logger.warn("Previous sync still running; skipping this tick");
        return;
    }
    running = true;
    try {
        await (0, sync_1.runSync)(config);
    }
    catch (err) {
        logger_1.logger.error("Sync pass failed", err);
    }
    finally {
        running = false;
    }
}
async function main() {
    (0, logger_1.initSentry)();
    const config = (0, config_1.loadConfig)();
    const tokens = await (0, store_1.loadTokens)();
    const missing = [];
    if (!tokens.spotify?.refreshToken)
        missing.push("spotify");
    if (config.targets.includes("tidal") && !tokens.tidal?.refreshToken)
        missing.push("tidal");
    if (config.targets.includes("youtube") && !tokens.youtube?.refreshToken)
        missing.push("youtube");
    if (missing.length > 0) {
        console.error(`Not authorized yet for: ${missing.join(", ")}. Run \`npm run auth\` first.`);
        process.exit(1);
    }
    logger_1.logger.info("MirrorWave starting", { cron: config.sync.cron });
    console.log(`MirrorWave running. Watching Spotify playlist on schedule "${config.sync.cron}".`);
    schedule.scheduleJob(config.sync.cron, () => void tick(config));
    if (config.sync.runOnStartup) {
        await tick(config);
    }
    const shutdown = async () => {
        logger_1.logger.info("Shutting down");
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
