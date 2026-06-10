import { uexGet } from "../api/uex/client.js";
import { getAllVehicles as fetchWikiVehicles, type GameVehicle } from "../api/wiki/client.js";
import { HOUR, TtlCache } from "./cache.js";
import { components } from "../api/uex/schema.js";

type VehicleDTO = components["schemas"]["VehicleDTO"];

/** Wraps the UEX vehicle endpoints. Returns raw DTOs, knows nothing about MCP. */
export class VehicleRepository {
    constructor(private cache: TtlCache) {}

    /** Pre-loads the long-lived vehicle data into the cache at startup. */
    async warm(): Promise<void> {
        await Promise.all([this.getAllWikiVehicles()]);
    }

    // TODO document return type and TTL
    getAllVehicles(): Promise<VehicleDTO[]> {
        return this.cache.get("vehicles", 24 * HOUR, () => uexGet<VehicleDTO[]>("/vehicles/"));
    }

    /** Full in-game vehicle catalogue from the wiki, cached for 24 hours. */
    getAllWikiVehicles(): Promise<GameVehicle[]> {
        return this.cache.get("vehicles:wiki", 24 * HOUR, () => fetchWikiVehicles());
    }
}
