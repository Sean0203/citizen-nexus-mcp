import type { Vehicle } from "./vehicle.models.js";
import { VehicleType } from "./vehicle.models.js";
import { PadType } from "./enums.js";
import { components } from "../api/schema.js";

type VehicleDTO = components["schemas"]["VehicleDTO"];

// Returns null if important vehicle fields are invalid, or if the vehicle is not available in game.
export function toVehicleModel(dto: VehicleDTO): Vehicle | null {
    // Important vehicle fields that cannot be null or undefined
    if (
        dto.id === undefined ||
        !dto.name ||
        !dto.name_full ||
        !dto.id_company ||
        !dto.company_name ||
        !dto.pad_type ||
        dto.is_concept === undefined ||
        dto.is_addon === undefined
    ) {
        return null;
    }

    // TODO make sure this behaves properly
    const vehicleTypes: VehicleType[] = (Object.keys(VehicleType) as (keyof typeof VehicleType)[])
        .filter((key) => isNaN(Number(key)))
        .filter((key) => dto[`is_${key}` as keyof VehicleDTO] === 1)
        .map((key) => VehicleType[key]);

    const crewNumbers = dto.crew?.split(",") ?? ["0"];

    // Note on max_container_size: The parsing assumes that UEX returns these sizes in ascending order.
    // That could change in future api versions.
    return {
        id: dto.id,
        name: dto.name,
        name_full: dto.name_full,
        id_manufacturer: dto.id_company,
        manufacturer: dto.company_name,
        types: vehicleTypes,
        cargo_scu: dto.scu ?? 0,
        max_container_size: Number(dto.container_sizes?.split(",").at(-1) ?? "0"),
        min_crew: Number(crewNumbers[0]),
        max_crew: Number(crewNumbers[1] ?? crewNumbers[0]),
        pad_type: PadType[dto.pad_type as keyof typeof PadType],
        is_concept: Boolean(dto.is_concept),
        is_addon: Boolean(dto.is_addon),
        can_quantum: Boolean(dto.is_quantum_capable),
        has_tractor_beam: Boolean(dto.is_tractor_beam)
    };
}
