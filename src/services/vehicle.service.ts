import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import Fuse, { IFuseOptions } from "fuse.js";

const VEHICLE_MAX_SEARCH_RESULTS = 5;

const FUSE_OPTIONS: IFuseOptions<VehicleWiki> = {
    keys: ["name", "shipmatrix_name", "slug", "class_name"],
    threshold: 0.4, // Light typos
    ignoreLocation: true, // match anywhere in the string, not just the start
    minMatchCharLength: 2
};

/** Business logic for vehicles: fuzzy name search over the cached wiki data. */
export class VehicleService {
    private fuse: Fuse<VehicleWiki> | null = null;

    constructor(private repo: VehicleRepository) {}

    private async getIndex(): Promise<Fuse<VehicleWiki>> {
        if (this.fuse) return this.fuse;
        this.fuse = new Fuse(await this.repo.getAllVehiclesWiki(), FUSE_OPTIONS);
        return this.fuse;
    }

    async searchVehicles(query: string): Promise<VehicleWiki[]> {
        const fuse = await this.getIndex();
        return fuse.search(query.trim(), { limit: VEHICLE_MAX_SEARCH_RESULTS }).map((res) => res.item);
    }
}
