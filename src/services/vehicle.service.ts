import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import { toPurchaseLocation, toRentalLocation, toVehicleModel } from "../domain/projections.js";
import type { PriceLocation } from "../domain/location.models.js";
import { Vehicle } from "../domain/vehicle.models.js";


/** Business logic for vehicles: name search and price lookups. */
export class VehicleService {
    constructor(private repo: VehicleRepository) {}

    async search(query: string): Promise<Vehicle[]> {
        const needle = query.trim().toLowerCase();
        const all = await this.repo.getAllVehicles();
        return all
            .filter((v) => [v.name, v.name_full, v.slug].some((f) => f?.toLowerCase().includes(needle)))
            .slice(0, 25)
            .map(toVehicleModel)
            .filter((v): v is Vehicle => v !== null);
    }

    async findPurchaseLocations(idVehicle: number): Promise<PriceLocation[]> {
        const prices = await this.repo.getAllVehiclePurchasePrices();
        return prices
            .filter((p) => p.id_vehicle === idVehicle)
            .map(toPurchaseLocation)
            .filter((pl): pl is PriceLocation =>  pl !== null)
            .sort(byPriceAsc);
    }

    async findRentalLocations(idVehicle: number): Promise<PriceLocation[]> {
        const prices = await this.repo.getAllVehicleRentalPrices();
        return prices
            .filter((p) => p.id_vehicle === idVehicle)
            .map(toRentalLocation)
            .filter((pl): pl is PriceLocation =>  pl !== null)
            .sort(byPriceAsc);
    }
}

function byPriceAsc(a: PriceLocation, b: PriceLocation): number {
    return a.price - b.price;
}
