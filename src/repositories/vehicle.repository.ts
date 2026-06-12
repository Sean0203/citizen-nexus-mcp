import { getAllVehicles as fetchVehiclesWiki } from "../api/wiki/client.js";
import { toVehicleWiki } from "../domain/wiki-vehicle.projection.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import { HOUR, TtlCache } from "./cache.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("vehicle.repository");

/** Wraps the wiki vehicle data. Returns the lean VehicleWiki shape and knows
 *  nothing about MCP. */
export class VehicleRepository {
    constructor(private cache: TtlCache) {}

    /** Pre-loads the long-lived vehicle data into the cache at startup. */
    async warm(): Promise<void> {
        log.info({ event: "cache_warm_start" });
        await Promise.all([this.getAllVehiclesWiki()]);
        log.info({ event: "cache_warm_done" });
    }

    /** Get the full in-game flight-ready vehicle catalogue from the wiki, projected to a lean
     *  VehicleWiki shape and cached for 24 hours. The raw game_vehicle objects
     *  are discarded after projection so they are never retained. */
    getAllVehiclesWiki(): Promise<VehicleWiki[]> {
        return this.cache.get("vehicles:wiki", 24 * HOUR, async () => {
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
            return vehicles;
        });
    }
}
