import type { components } from "../api/wiki/schema.js";
import type { CargoGrid, ManufacturerWiki, PriceEntry, VehicleWiki } from "./wiki-vehicle.models.js";
import { metricToSCUCargoGrid } from "./cargo.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("wiki-vehicle.projection");

type GameVehicle = components["schemas"]["game_vehicle"];

/** A localized text field as returned by the wiki; we only read en_EN. */
interface Localized {
    en_EN?: string | null;
}

/**
 * The subset of a raw game_vehicle we read, typed from the live API response.
 * We map from this local shape rather than the generated schema type because
 * the published spec is not exact for some nested objects (for example
 * cargo_limits is documented as min/max but is returned as min_size/max_size).
 */
interface Raw {
    uuid?: string | null;
    name?: string | null;
    game_name?: string | null;
    slug?: string | null;
    class_name?: string | null;
    shipmatrix_name?: string | null;
    id?: number | null;
    chassis_id?: number | null;
    port_tags?: string[] | null;
    web_url?: string | null;
    link?: string | null;
    manufacturer?: ManufacturerWiki | null;
    career?: string | null;
    role?: string | null;
    type?: Localized | null;
    size?: Localized | null;
    foci?: Localized[] | null;
    production_status?: Localized | null;
    production_note?: Localized | null;
    description?: Localized | null;
    game_description?: Localized | null;
    is_vehicle?: boolean | null;
    is_gravlev?: boolean | null;
    is_spaceship?: boolean | null;
    size_class?: number | null;
    crew?: { min?: number | null; max?: number | null } | null;
    cargo_capacity?: number | null;
    ore_capacity?: number | null;
    cargo_limits?: { min_scu_box?: number | null } | null;
    cargo_grids?: CargoGrid[] | null;
    quantum?: {
        quantum_speed?: number | null;
        quantum_spool_time?: number | null;
        quantum_fuel_capacity?: number | null;
        quantum_range?: number | null;
        port_olisar_to_arccorp_time?: number | null;
        port_olisar_to_arccorp_fuel?: number | null;
    } | null;
    uex_prices?: { purchase?: PriceEntry[] | null; rental?: PriceEntry[] | null } | null;
}

const en = (l: Localized | null | undefined): string | null => l?.en_EN ?? null;

/**
 * Project a raw game_vehicle type into a VehicleWiki type.
 * Localized fields are flattened to en_EN.
 */
export function toVehicleWiki(gv: GameVehicle): VehicleWiki | null {
    const r = gv as unknown as Raw;

    // Type guard for string types
    if (!(r.uuid && r.name)) {
        log.debug({ event: "toVehicleWiki", message: "found vehicle with invalid state" });
        return null;
    }

    return {
        uuid: r.uuid ?? null,
        name: r.name ?? null,
        game_name: r.game_name ?? null,
        slug: r.slug ?? null,
        id: r.id ?? null,
        chassis_id: r.chassis_id ?? null,
        web_url: r.web_url ?? null,
        link: r.link ?? null,

        manufacturer: r.manufacturer ?? null,

        career: r.career ?? null,
        role: r.role ?? null,
        type: en(r.type),
        size: en(r.size),
        foci: (r.foci ?? []).map(en).filter((s): s is string => s !== null),
        production_status: en(r.production_status),
        description: en(r.description),
        game_description: en(r.game_description),

        is_vehicle: r.is_vehicle ?? null,
        is_gravlev: r.is_gravlev ?? null,
        is_spaceship: r.is_spaceship ?? null,

        size_class: r.size_class ?? null,

        crew: { min: r.crew?.min ?? null, max: r.crew?.max ?? null },

        cargo_capacity: r.cargo_capacity ?? null,
        ore_capacity: r.ore_capacity ?? null,
        max_scu_box: r.cargo_limits?.min_scu_box ?? null,
        cargo_grids: r.cargo_grids?.map(metricToSCUCargoGrid) ?? [],

        quantum: {
            quantum_speed: r.quantum?.quantum_speed ?? null,
            quantum_spool_time: r.quantum?.quantum_spool_time ?? null,
            quantum_fuel_capacity: r.quantum?.quantum_fuel_capacity ?? null,
            quantum_range: r.quantum?.quantum_range ?? null,
            port_olisar_to_arccorp_time: r.quantum?.port_olisar_to_arccorp_time ?? null,
            port_olisar_to_arccorp_fuel: r.quantum?.port_olisar_to_arccorp_fuel ?? null
        },

        uex_prices: {
            purchase: r.uex_prices?.purchase ?? [],
            rental: r.uex_prices?.rental ?? []
        }
    };
}
