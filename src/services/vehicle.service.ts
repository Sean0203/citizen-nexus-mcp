import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import { toVehicleModel } from "../domain/projections.js";
import { Vehicle } from "../domain/vehicle.models.js";
import Fuse, { IFuseOptions } from "fuse.js";

const VEHICLE_MAX_SEARCH_RESULTS = 10;

const FUSE_OPTIONS: IFuseOptions<Vehicle> = {
    keys: ["name_full", "name", "slug"],
    threshold: 1, // tolerates light typos.
    ignoreLocation: true, // match anywhere in the string, not just the start
    minMatchCharLength: 2
};

/** Business logic for vehicles: name search and price lookups. */
export class VehicleService {
    private fuse: Fuse<Vehicle> | null = null;

    constructor(private repo: VehicleRepository) {}

    private async getAvailableVehicles(): Promise<Vehicle[]> {
        return (await this.repo.getAllVehicles())
            .map(toVehicleModel)
            .filter((v): v is Vehicle => v !== null && !v.is_concept && !v.is_addon);
    }

    private async getIndex(): Promise<Fuse<Vehicle>> {
        if (this.fuse) return this.fuse; // already built → reuse
        this.fuse = new Fuse(await this.getAvailableVehicles(), FUSE_OPTIONS); // build once, store on the instance
        return this.fuse;
    }

    async searchVehicles(query: string): Promise<Vehicle[]> {
        const fuse = await this.getIndex();
        return fuse.search(query.trim(), { limit: VEHICLE_MAX_SEARCH_RESULTS }).map((res) => res.item);
    }
}
