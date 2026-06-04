import {uexGet} from "../api/client.js";
import {TtlCache, HOUR, MINUTE} from "./cache.js";
import {components} from "../api/schema.js";

type VehicleDTO = components["schemas"]["VehicleDTO"];
type VehiclePurchasePriceDTO = components["schemas"]["VehiclePurchasePriceDTO"];
type VehicleRentalPriceDTO = components["schemas"]["VehicleRentalPriceDTO"];

/** Wraps the UEX vehicle endpoints. Returns raw DTOs, knows nothing about MCP. */
export class VehicleRepository {
    constructor(private cache: TtlCache) {
    }

    // Reference data: slow-changing, cache for a day.
    getAll(): Promise<VehicleDTO[]> {
        return this.cache.get("vehicles", 24 * HOUR, () => uexGet<VehicleDTO[]>("/vehicles/"));
    }

    // Price data: community-reported, short TTL.
    getPurchasePrices(idTerminal: number): Promise<VehiclePurchasePriceDTO[]> {
        return this.cache.get(`veh_purchase:${idTerminal}`, 5 * MINUTE, () =>
            uexGet<VehiclePurchasePriceDTO[]>(`/vehicles_purchases_prices/id_terminal/${idTerminal}/`),
        );
    }

    getAllPurchasePrices(): Promise<VehiclePurchasePriceDTO[]> {
        return this.cache.get("veh_purchase_all", 5 * MINUTE, () =>
            uexGet<VehiclePurchasePriceDTO[]>("/vehicles_purchases_prices_all/"),
        );
    }

    getAllRentalPrices(): Promise<VehicleRentalPriceDTO[]> {
        return this.cache.get("veh_rental_all", 5 * MINUTE, () =>
            uexGet<VehicleRentalPriceDTO[]>("/vehicles_rentals_prices_all/"),
        );
    }
}
