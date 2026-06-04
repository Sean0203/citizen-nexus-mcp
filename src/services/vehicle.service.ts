import type {VehicleRepository} from "../repositories/vehicle.repository.js";
import {
    toVehicleSummary,
    toPurchaseLocation,
    toRentalLocation,
} from "../domain/projections.js";
import type {VehicleSummary, PriceLocation} from "../domain/models.js";

/** Business logic for vehicles: name search and price lookups. */
export class VehicleService {
    constructor(private repo: VehicleRepository) {
    }

    async search(query: string): Promise<VehicleSummary[]> {
        const needle = query.trim().toLowerCase();
        const all = await this.repo.getAll();
        return all
            .filter((v) =>
                [v.name, v.name_full, v.slug].some((f) => f?.toLowerCase().includes(needle)),
            )
            .slice(0, 25)
            .map(toVehicleSummary);
    }

    async findPurchaseLocations(idVehicle: number): Promise<PriceLocation[]> {
        const prices = await this.repo.getAllPurchasePrices();
        return prices
            .filter((p) => p.id_vehicle === idVehicle)
            .map(toPurchaseLocation)
            .sort(byPriceAsc);
    }

    async findRentalLocations(idVehicle: number): Promise<PriceLocation[]> {
        const prices = await this.repo.getAllRentalPrices();
        return prices
            .filter((p) => p.id_vehicle === idVehicle)
            .map(toRentalLocation)
            .sort(byPriceAsc);
    }
}

function byPriceAsc(a: PriceLocation, b: PriceLocation): number {
    return (a.price ?? Infinity) - (b.price ?? Infinity);
}
