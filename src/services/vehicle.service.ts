import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import { toPurchaseLocation, toRentalLocation, toVehicleModel } from "../domain/projections.js";
import type { PriceLocation } from "../domain/location.models.js";
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

    /** Returns all available (non-concept, non-addon) vehicles. */
    async getAllAvailableVehicles(): Promise<Vehicle[]> {
        return this.getAvailableVehicles();
    }

    async searchVehicles(query: string): Promise<Vehicle[]> {
        const fuse = await this.getIndex();
        return fuse.search(query.trim(), { limit: VEHICLE_MAX_SEARCH_RESULTS }).map((res) => res.item);
    }

    async findPurchaseLocations(idVehicle: number): Promise<PriceLocation[]> {
        const prices = await this.repo.getAllVehiclePurchasePrices();
        return prices
            .filter((p) => p.id_vehicle === idVehicle)
            .map(toPurchaseLocation)
            .filter((pl): pl is PriceLocation => pl !== null)
            .sort(byPriceAsc);
    }

    async findRentalLocations(idVehicle: number): Promise<PriceLocation[]> {
        const prices = await this.repo.getAllVehicleRentalPrices();
        return prices
            .filter((p) => p.id_vehicle === idVehicle)
            .map(toRentalLocation)
            .filter((pl): pl is PriceLocation => pl !== null)
            .sort(byPriceAsc);
    }
}

function byPriceAsc(a: PriceLocation, b: PriceLocation): number {
    return a.price - b.price;
}
