// Hand-written slices of the UEX DTOs. Replace with the generated types from
// `npm run gen:types` once the spec is wired up. Fields are nullable because
// the data is crowdsourced.

export interface VehicleDTO {
    id: number;
    name: string;
    name_full: string | null;
    slug: string | null;
    company_name: string | null;
    is_spaceship: number | null;
    is_ground_vehicle: number | null;
    scu: number | null;
}

export interface VehiclePurchasePriceDTO {
    id: number;
    id_vehicle: number;
    id_terminal: number;
    terminal_name: string | null;
    star_system_name: string | null;
    planet_name: string | null;
    moon_name: string | null;
    city_name: string | null;
    price_buy: number | null;
}

export interface VehicleRentalPriceDTO {
    id: number;
    id_vehicle: number;
    id_terminal: number;
    terminal_name: string | null;
    star_system_name: string | null;
    planet_name: string | null;
    moon_name: string | null;
    city_name: string | null;
    price_rent: number | null;
}
