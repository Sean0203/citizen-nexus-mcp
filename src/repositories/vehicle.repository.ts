import { uexGet } from "../api/client.js";
import { HOUR, MINUTE, TtlCache } from "./cache.js";
import { components } from "../api/schema.js";

type VehicleDTO = components["schemas"]["VehicleDTO"];

/** Wraps the UEX vehicle endpoints. Returns raw DTOs, knows nothing about MCP. */
export class VehicleRepository {
    constructor(private cache: TtlCache) {}

    /** Pre-loads data from vehicle attributes and prices */
    async warm(): Promise<void> {
        await Promise.all([this.getAllVehicles()]);
    }

    // TODO document return type and TTL
    getAllVehicles(): Promise<VehicleDTO[]> {
        return this.cache.get("vehicles", 24 * HOUR, () => uexGet<VehicleDTO[]>("/vehicles/"));
    }
}
