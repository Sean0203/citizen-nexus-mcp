import type {VehicleSummary, PriceLocation} from "./models.js";
import {components} from "../api/schema.js";

type VehicleDTO = components["schemas"]["VehicleDTO"];
type VehiclePurchasePriceDTO = components["schemas"]["VehiclePurchasePriceDTO"];
type VehicleRentalPriceDTO = components["schemas"]["VehicleRentalPriceDTO"];

// TODO: handle nullable data

export function toVehicleSummary(dto: VehicleDTO): VehicleSummary {
    return {
        id: dto.id,
        name: dto.name_full ?? dto.name,
        manufacturer: dto.company_name,
        cargoScu: dto.scu,
    };
}

/** Builds a readable location string from the denormalized price fields. */ // TODO: check for space stations, planetary cities, non-city POIs, etc
function formatLocation(dto: {
    star_system_name: string | null;
    planet_name: string | null;
    moon_name: string | null;
    city_name: string | null;
}): string {
    return [dto.star_system_name, dto.planet_name, dto.moon_name, dto.city_name]
        .filter((p): p is string => Boolean(p))
        .join(" / ");
}

export function toPurchaseLocation(dto: VehiclePurchasePriceDTO): PriceLocation {
    return {terminal: dto.terminal_name, location: formatLocation(dto), price: dto.price_buy};
}

export function toRentalLocation(dto: VehicleRentalPriceDTO): PriceLocation {
    return {terminal: dto.terminal_name, location: formatLocation(dto), price: dto.price_rent};
}
