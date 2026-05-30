import type { Config } from "../config";
import { TidalDestination } from "./tidal";
import { YouTubeDestination } from "./youtube";
import type { Destination } from "./types";

/** Builds the enabled destination instances from config, in target order. */
export function buildDestinations(config: Config): Destination[] {
  const destinations: Destination[] = [];
  for (const target of config.targets) {
    if (target === "tidal" && config.tidal) {
      destinations.push(new TidalDestination(config.tidal));
    } else if (target === "youtube" && config.youtube) {
      destinations.push(new YouTubeDestination(config.youtube));
    }
  }
  return destinations;
}

export type { Destination } from "./types";
