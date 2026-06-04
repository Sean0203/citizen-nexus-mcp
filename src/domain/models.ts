// The compact shapes returned to the LLM. Types only, no behavior.

export interface VehicleSummary {
    id: number;
    name: string;
    manufacturer: string | null;
    cargoScu: number | null;
}

export interface PriceLocation {
    terminal: string | null;
    location: string;
    price: number | null;
}
