import { getAllVehicles as fetchVehiclesWiki } from "../api/wiki/client.js";
import { toVehicleWiki } from "../domain/wiki-vehicle.projection.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import { HOUR, TtlCache } from "./cache.js";
import type { Warmable } from "./warmable.js";
import { createLogger } from "../logging/logger.js";
import Fuse, { IFuseOptions } from "fuse.js";

const log = createLogger("vehicle.repository");

/** TTL for the vehicle data and index cache entries. */
const VEHICLE_TTL = 24 * HOUR;

const VEHICLE_DATA_KEY = "vehicles:wiki";
const VEHICLE_INDEX_KEY = "vehicles:wiki:index";

/** Fuzzy-search tuning for the vehicle catalogue. */
const VEHICLE_FUSE_OPTIONS: IFuseOptions<VehicleWiki> = {
    keys: ["name", "game_name", "slug"],
    threshold: 0.3, // Light typos
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    ignoreDiacritics: true,
    minMatchCharLength: 2
};

export class VehicleRepository implements Warmable {
    constructor(private cache: TtlCache) {}

    /** Pre-loads long-lived data into the cache. Meant to be called once at startup. */
    async warm(): Promise<void> {
        log.info({ event: "cache_warm_start" });
        await Promise.all([this.getVehicleIndex()]);
        log.info({ event: "cache_warm_done" });
    }

    /** Flight-ready vehicle catalogue from the wiki, projected and cached for 24h. */
    getAllVehiclesWiki(): Promise<VehicleWiki[]> {
        return this.cache.get(VEHICLE_DATA_KEY, VEHICLE_TTL, async () => {
            const startedAt = Date.now();
            const raw = await fetchVehiclesWiki();
            const vehicles = raw
                .map(toVehicleWiki)
                .filter((v) => v !== null)
                .filter((v) => v.production_status === "flight-ready");
            log.info({
                event: "vehicle_catalogue_loaded",
                fetched: raw.length,
                kept: vehicles.length,
                ms: Date.now() - startedAt
            });
            this.cache.clear(VEHICLE_INDEX_KEY);
            return vehicles;
        });
    }

    /** Fuzzy-search index over the flight-ready vehicle catalogue, cached for 24h. */
    getVehicleIndex(): Promise<Fuse<VehicleWiki>> {
        return this.cache.get(VEHICLE_INDEX_KEY, VEHICLE_TTL, async () => {
            const vehicles = await this.getAllVehiclesWiki();
            const index = new Fuse(vehicles, VEHICLE_FUSE_OPTIONS);
            log.info({ event: "vehicle_index_built", count: vehicles.length });
            return index;
        });
    }
}
