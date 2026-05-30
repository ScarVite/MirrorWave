"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DestinationStop = void 0;
/**
 * Thrown by a destination when it cannot continue this pass (e.g. API quota
 * exhausted). The orchestrator stops processing that destination and persists
 * progress so the remaining tracks are retried on the next run.
 */
class DestinationStop extends Error {
}
exports.DestinationStop = DestinationStop;
