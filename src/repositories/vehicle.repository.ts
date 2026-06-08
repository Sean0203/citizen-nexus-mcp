import { uexGet } from "../api/client.js";
import { HOUR, MINUTE, TtlCache } from "./cache.js";
import { components } from "../api/schema.js";

type VehicleDTO = components["schemas"]["VehicleDTO"];
type VehiclePurchasePriceDTO = components["schemas"]["VehiclePurchasePriceDTO"];
type VehicleRentalPriceDTO = components["schemas"]["VehicleRentalPriceDTO"];

/** Wraps the UEX vehicle endpoints. Returns raw DTOs, knows nothing about MCP. */
export class VehicleRepository {
    constructor(private cache: TtlCache) {}

    /** Pre-loads data from vehicle attributes and prices */
    async warm(): Promise<void> {
        await Promise.all([
            this.getAllVehicles(),
            this.getAllVehiclePurchasePrices(),
            this.getAllVehicleRentalPrices()
        ]);
    }

    // TODO document return type and TTL
    getAllVehicles(): Promise<VehicleDTO[]> {
        return this.cache.get("vehicles", 24 * HOUR, () => uexGet<VehicleDTO[]>("/vehicles/"));
    }

    // TODO document return type and TTL
    getVehiclePurchasePrices(idTerminal: number): Promise<VehiclePurchasePriceDTO[]> {
        return this.cache.get(`veh_purchase:${idTerminal}`, 5 * MINUTE, () =>
            uexGet<VehiclePurchasePriceDTO[]>(`/vehicles_purchases_prices/id_terminal/${idTerminal}/`)
        );
    }

    // TODO document return type and TTL
    getAllVehiclePurchasePrices(): Promise<VehiclePurchasePriceDTO[]> {
        return this.cache.get("veh_purchase_all", 5 * MINUTE, () =>
            uexGet<VehiclePurchasePriceDTO[]>("/vehicles_purchases_prices_all/")
        );
    }

    // TODO document return type and TTL
    getAllVehicleRentalPrices(): Promise<VehicleRentalPriceDTO[]> {
        return this.cache.get("veh_rental_all", 5 * MINUTE, () =>
            uexGet<VehicleRentalPriceDTO[]>("/vehicles_rentals_prices_all/")
        );
    }
}
