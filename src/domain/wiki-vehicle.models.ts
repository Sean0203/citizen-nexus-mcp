/**
 * Lean, in-memory representation of a wiki vehicle. This is the shape stored in
 * the cache and indexed for search, so the heavy raw game_vehicle objects (over
 * 2000 lines each) are never retained. Localized text fields are flattened to
 * their en_EN value during projection (see wiki-vehicle.projection.ts).
 *
 * Most fields are nullable because the source data is frequently incomplete.
 */

export interface ManufacturerWiki {
    name: string;
    code: string;
    uuid: string;
    link: string;
}

export interface CargoGrid {
    uuid: string;
    width: number;
    height: number;
    length: number;
    volume: number;
    scu: number;
    open: boolean | null; // Seems always false for now
    external: boolean | null;
    closed: boolean | null; // Seems always false for now
    max_scu_box: number;
}

/** Quantum-travel attributes: how fast and how far the vehicle can travel. */
export interface QuantumTravel {
    quantum_speed: number | null; // m/s
    quantum_spool_time: number | null; // s
    quantum_fuel_capacity: number | null;
    quantum_range: number | null; // m
    port_olisar_to_arccorp_time: number | null; // s, benchmark route
    port_olisar_to_arccorp_fuel: number | null; // benchmark route
}

export interface PriceStarmapLocation {
    uuid: string;
    name: string;
    slug: string | null;
    type_name: string | null;
    parent_name: string | null;
    star_system_name: string;
    link: string | null;
    web_url: string | null;
}

/** A single UEX purchase or rental listing for the vehicle. */
export interface PriceEntry {
    price_buy: number;
    price_sell: number | null;
    price_rent: number;
    terminal_id: number | null;
    terminal_code: string | null;
    terminal_name: string | null;
    starmap_location: PriceStarmapLocation;
    game_version: string | null;
    uex_link: string;
}

export interface UexPrices {
    purchase: PriceEntry[];
    rental: PriceEntry[];
}

export interface VehicleWiki {
    // Identity
    uuid: string;
    name: string;
    game_name: string | null;
    slug: string | null;
    id: number | null;
    chassis_id: number | null;
    web_url: string | null;
    link: string | null;

    // Manufacturer
    manufacturer: ManufacturerWiki | null;

    // Classification (localized fields flattened to en_EN)
    career: string | null;
    role: string | null;
    type: string | null;
    size: string | null; // size category label, e.g. "medium"
    foci: string[];
    production_status: string | null; // "flight-ready" vs "in-concept"
    description: string | null;
    game_description: string | null;

    // Type flags
    is_vehicle: boolean | null;
    is_gravlev: boolean | null;
    is_spaceship: boolean | null;

    // Raw size class (1-6). Not a landing pad size; the API exposes no
    // vehicle-to-pad mapping. Pad/hangar sizes live on locations instead.
    size_class: number | null;

    // Crew
    crew: { min: number | null; max: number | null };

    // Cargo
    cargo_capacity: number | null;
    ore_capacity: number | null;
    max_scu_box: number | null;
    cargo_grids: CargoGrid[];

    // Quantum travel
    quantum: QuantumTravel;

    // In-game prices (UEC)
    uex_prices: UexPrices;
}
