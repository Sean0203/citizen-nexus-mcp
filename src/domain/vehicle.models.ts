import { PadType } from "./enums.js";

export enum VehicleType {
    boarding = 1,
    bomber,
    cargo,
    carrier,
    civilian,
    concept,
    construction,
    datarunner,
    docking,
    emp,
    exploration,
    ground_vehicle,
    hangar,
    industrial,
    interdiction,
    loading_dock,
    medical,
    military,
    mining,
    passenger,
    qed,
    racing,
    refinery,
    refuel,
    repair,
    research,
    salvage,
    scanning,
    science,
    showdown_winner,
    spaceship,
    starter,
    stealth
}

export interface Vehicle {
    id: number;
    name: string | null;
    name_full: string | null;
    id_manufacturer: number;
    manufacturer: string | null;
    types: VehicleType[];
    cargo_scu: number | null;
    min_crew: number;
    max_crew: number;
    pad_type: PadType | null;
    is_addon: boolean;
    can_quantum: boolean;
    has_tractor_beam: boolean;
}
