import { getAllVehicles as fetchVehiclesWiki } from "../api/wiki/client.js";
import { toVehicleWiki } from "../domain/wiki-vehicle.projection.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import { HOUR, TtlCache } from "./cache.js";

/** Wraps the wiki vehicle data. Returns the lean VehicleWiki shape and knows
 *  nothing about MCP. */
export class VehicleRepository {
    constructor(private cache: TtlCache) {}

    /** Pre-loads the long-lived vehicle data into the cache at startup. */
    async warm(): Promise<void> {
        await Promise.all([this.getAllVehiclesWiki()]);
    }

    /** Full in-game flight-ready vehicle catalogue from the wiki, projected to the lean
     *  VehicleWiki shape and cached for 24 hours. The raw game_vehicle objects
     *  are discarded after projection so they are never retained. */
    getAllVehiclesWiki(): Promise<VehicleWiki[]> {
        return this.cache.get("vehicles:wiki", 24 * HOUR, async () => {
            const raw = await fetchVehiclesWiki();
            return raw
                .map(toVehicleWiki)
                .filter((v) => v !== null)
                .filter((v) => v.production_status === "flight-ready");
        });
    }
}
