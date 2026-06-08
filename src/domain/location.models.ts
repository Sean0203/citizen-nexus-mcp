import { PadType } from "./enums.js";

export interface StarSystem {
    id: number;
    name: string;
}

export interface Jurisdiction {
    id: number;
    name: string;
    nickname: string | null;
    id_faction: number | null;
    faction_name: string | null;
}

export interface Orbit {
    id: number;
    name: string;
    is_lagrange: boolean;
    is_planet: boolean;
    is_star: boolean;
    is_jump_point: boolean;

    id_faction: number;
    faction_name: string | null;
    id_jurisdiction: number;
    jurisdiction_name: string | null;
    id_star_system: number;
    star_system_name: string | null;
}

export interface SpaceStation {
    id: number;
    name: string;
    nickname: string;
    is_armistice: boolean;
    is_monitored: boolean;
    is_lagrange: boolean;
    is_jump_point: boolean;
    pad_types: [PadType];

    has_trade_terminal: boolean;
    has_habitation: boolean;
    has_refinery: boolean;
    has_cargo_center: boolean;
    has_clinic: boolean;
    has_food: boolean;
    has_shops: boolean;
    has_refuel: boolean;
    has_repair: boolean;
    has_loading_dock: boolean;
    has_docking_port: boolean;
    has_freight_elevator: boolean;

    id_faction: number;
    faction_name: string | null;
    id_jurisdiction: number;
    jurisdiction_name: string | null;
    id_star_system: number | null;
    star_system_name: string | null;
    id_orbit: number;
    orbit_name: string | null;
    id_planet: number;
    planet_name: string | null;
    id_moon: number;
    moon_name: string | null;
    id_city: number; // city next to space station
    city_name: string | null;
}

export interface JumpPoint {
    id: number;
    id_star_system_origin: number;
    id_star_system_destination: number;
    star_system_origin_name: string | null;
    star_system_destination_name: string | null;
    id_orbit_origin: number;
    id_orbit_destination: number;
    orbit_origin_name: string | null;
    orbit_destination_name: string | null;
}

export interface Planet {
    id: number;
    name: string;
    name_origin: string | null;

    id_faction: number;
    faction_name: string | null;
    id_jurisdiction: number;
    jurisdiction_name: string | null;
    id_star_system: number;
    star_system_name: string | null;
}

export interface Moon {
    id: number;
    name: string;
    name_origin: string | null;

    id_faction: number;
    faction_name: string | null;
    id_jurisdiction: number;
    jurisdiction_name: string | null;
    id_star_system: number;
    star_system_name: string | null;
    id_orbit: number;
    orbit_name: string | null;
    id_planet: number;
    planet_name: string | null;
}

export interface City {
    id: number;
    name: string;
    is_armistice: boolean;
    is_monitored: boolean;
    is_landable: boolean;
    pad_types: [PadType];

    has_trade_terminal: boolean;
    has_habitation: boolean;
    has_refinery: boolean;
    has_cargo_center: boolean;
    has_clinic: boolean;
    has_food: boolean;
    has_shops: boolean;
    has_refuel: boolean;
    has_repair: boolean;
    has_loading_dock: boolean;
    has_docking_port: boolean;
    has_freight_elevator: boolean;

    id_faction: number;
    faction_name: string | null;
    id_jurisdiction: number;
    jurisdiction_name: string | null;
    id_star_system: number;
    star_system_name: string | null;
    id_orbit: number;
    orbit_name: string | null;
    id_planet: number;
    planet_name: string | null;
    id_moon: number;
    moon_name: string | null;
}

export interface Outpost {
    id: number;
    name: string;
    nickname: string | null;
    is_armistice: boolean;
    is_monitored: boolean;
    is_landable: boolean;
    pad_types: [PadType];

    has_trade_terminal: boolean;
    has_habitation: boolean;
    has_refinery: boolean;
    has_cargo_center: boolean;
    has_clinic: boolean;
    has_food: boolean;
    has_shops: boolean;
    has_refuel: boolean;
    has_repair: boolean;
    has_loading_dock: boolean;
    has_docking_port: boolean;
    has_freight_elevator: boolean;

    id_faction: number;
    faction_name: string | null;
    id_jurisdiction: number;
    jurisdiction_name: string | null;
    id_star_system: number;
    star_system_name: string | null;
    id_orbit: number;
    orbit_name: string | null;
    id_planet: number;
    planet_name: string | null;
    id_moon: number;
    moon_name: string | null;
}

export interface Terminal {
    id: number;
    name: string | null;
    nickname: string | null;
    code: string | null;
    type: string | null;
    max_container_size: number;
    id_company: number;
    company_name: string | null;

    is_jump_point: boolean;
    is_cargo_center: boolean;
    is_habitation: boolean;
    is_refinery: boolean;
    is_refuel: boolean;
    is_repair: boolean;
    is_food: boolean;
    is_medical: boolean;
    is_shop_fps: boolean;
    is_shop_vehicle: boolean;

    has_loading_dock: boolean;
    has_docking_port: boolean;
    has_freight_elevator: boolean;

    id_faction: number;
    faction_name: string | null;
    id_star_system: number;
    star_system_name: string | null;
    id_orbit: number;
    orbit_name: string | null;
    id_planet: number;
    planet_name: string | null;
    id_moon: number;
    moon_name: string | null;
    id_city: number;
    city_name: string | null;
    id_outpost: number;
    outpost_name: string | null;
    id_space_station: number;
    space_station_name: string | null;
    id_poi: number;
}

export interface LocationStruct {
    star_system_name: string;
    orbit_name: string | null;
    planet_name: string | null;
    moon_name: string | null;
    space_station_name: string | null;
    city_name: string | null;
    outpost_name: string | null;
}

export interface PriceLocation {
    id_terminal: number;
    locationPath: string;
    price: number;
}

/** UEX returns name fields as "", [], or {} when empty. Collapse all of those to null. */
function name(value: unknown): string | null {
    const isNonEmptyString = typeof value === "string" && value.length > 0;
    return isNonEmptyString ? value : null;
}

/** Put all the available location names in a dto into a LocationStruct type */
export function toLocation(dto: Record<string, unknown>): LocationStruct {
    return {
        star_system_name: name(dto.star_system_name) ?? "",
        orbit_name: name(dto.orbit_name),
        planet_name: name(dto.planet_name),
        moon_name: name(dto.moon_name),
        space_station_name: name(dto.space_station_name),
        city_name: name(dto.city_name),
        outpost_name: name(dto.outpost_name)
    };
}
