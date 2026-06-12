import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import Fuse, { IFuseOptions } from "fuse.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("vehicle.service");

const VEHICLE_MAX_SEARCH_RESULTS = 10;

const FUSE_OPTIONS: IFuseOptions<VehicleWiki> = {
    keys: [
        { name: "name", weight: 0.2 },
        { name: "game_name", weight: 0.2 },
        { name: "slug", weight: 5 }
    ],
    threshold: 0.3, // Light typos,
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    ignoreDiacritics: true,
    minMatchCharLength: 2
};

/** Business logic for vehicles: fuzzy name search over the cached wiki data. */
export class VehicleService {
    private fuse: Fuse<VehicleWiki> | null = null;

    constructor(private repo: VehicleRepository) {}

    private async getIndex(): Promise<Fuse<VehicleWiki>> {
        if (this.fuse) return this.fuse;
        const vehicles = await this.repo.getAllVehiclesWiki();
        this.fuse = new Fuse(vehicles, FUSE_OPTIONS);
        log.info({ event: "index_built", count: vehicles.length });
        return this.fuse;
    }

    async searchVehicles(query: string): Promise<VehicleWiki[]> {
        const fuse = await this.getIndex();
        const items = fuse.search(query.trim(), { limit: VEHICLE_MAX_SEARCH_RESULTS }).map((res) => res.item);
        log.debug({ event: "search", query, results: items.length });
        return items;
        // return items.map((i) => ({ v: i.item, score: i }));
    }
}
