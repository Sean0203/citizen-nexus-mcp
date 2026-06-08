import { TtlCache } from "./repositories/cache.js";
import { VehicleRepository } from "./repositories/vehicle.repository.js";
import { VehicleService } from "./services/vehicle.service.js";

/** Builds and wires the dependency graph. Plain module-level instances. */
export function createContainer() {
    const cache = new TtlCache();
    const vehicleRepository = new VehicleRepository(cache);
    const vehicleService = new VehicleService(vehicleRepository);

    // Preload long-TTL data into the cache at startup
    void vehicleRepository.warm().catch((err) => {
        console.error("cache warm failed", err);
    });

    return { vehicleService };
}

export type Container = ReturnType<typeof createContainer>;
