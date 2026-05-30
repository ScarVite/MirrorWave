import type { Config } from "../config";
import type { Destination } from "./types";
/** Builds the enabled destination instances from config, in target order. */
export declare function buildDestinations(config: Config): Destination[];
export type { Destination } from "./types";
