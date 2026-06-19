import { TtlCache } from "./repositories/cache.js";
import { VehicleRepository } from "./repositories/vehicle.repository.js";
import { VehicleService } from "./services/vehicle.service.js";
import type { Warmable } from "./repositories/warmable.js";
import { createLogger } from "./logging/logger.js";

const log = createLogger("container");

/** Builds and wires the dependency graph. Plain module-level instances. */
export function createContainer() {
    const cache = new TtlCache();
    const vehicleRepository = new VehicleRepository(cache);
    const vehicleService = new VehicleService(vehicleRepository);

    // Preload long-TTL data into the cache at startup. Fire-and-forget and
    // non-fatal: a failure is logged, and the first request re-fetches on demand.
    const warmables: Warmable[] = [vehicleRepository];
    for (const w of warmables) {
        void w
            .warm()
            .catch((err) =>
                log.error({ event: "cache_warm_failed", warmable: w.constructor.name, error: String(err) })
            );
    }

    return { vehicleService };
}

export type Container = ReturnType<typeof createContainer>;
