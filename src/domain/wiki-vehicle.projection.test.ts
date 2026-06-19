import { describe, expect, it } from "vitest";
import type { components } from "../api/wiki/schema.js";
import type { ManufacturerWiki } from "./wiki-vehicle.models.js";
import { toVehicleWiki } from "./wiki-vehicle.projection.js";

type GameVehicle = components["schemas"]["game_vehicle"];

// A localized text field as the wiki returns it.
const loc = (s: string | null) => ({ en_EN: s });

// Factory: a minimally valid raw game_vehicle (uuid + name present), as the live
// API shapes it. The projection casts internally, so we build the raw shape and
// cast to GameVehicle. Override only what a test cares about.
function rawVehicle(overrides: Record<string, unknown> = {}): GameVehicle {
    return {
        uuid: "v-uuid",
        name: "Constellation Andromeda",
        ...overrides
    } as unknown as GameVehicle;
}

describe("toVehicleWiki", () => {
    it.each([
        { name: "uuid missing", overrides: { uuid: null } },
        { name: "name missing", overrides: { name: null } },
        { name: "both missing", overrides: { uuid: null, name: null } },
        { name: "uuid empty string", overrides: { uuid: "" } },
        { name: "name empty string", overrides: { name: "" } }
    ])("should return null when $name", ({ overrides }) => {
        expect(toVehicleWiki(rawVehicle(overrides))).toBeNull();
    });

    it("should map identity fields straight through", () => {
        const result = toVehicleWiki(
            rawVehicle({
                uuid: "abc",
                name: "Avenger",
                game_name: "AEGS_Avenger",
                slug: "avenger",
                id: 7,
                chassis_id: 3
            })
        );
        expect(result).toMatchObject({
            uuid: "abc",
            name: "Avenger",
            game_name: "AEGS_Avenger",
            slug: "avenger",
            id: 7,
            chassis_id: 3
        });
    });

    it("should pass the manufacturer object through unchanged", () => {
        const manufacturer: ManufacturerWiki = { name: "Aegis", code: "AEGS", uuid: "m-uuid", link: "/m/aegs" };
        const result = toVehicleWiki(rawVehicle({ manufacturer }));
        expect(result?.manufacturer).toEqual(manufacturer);
    });

    it("should flatten localized fields to their en_EN value", () => {
        const result = toVehicleWiki(
            rawVehicle({
                type: loc("Multi-Role"),
                size: loc("medium"),
                production_status: loc("flight-ready"),
                description: loc("A versatile ship."),
                game_description: loc("In-game blurb.")
            })
        );
        expect(result).toMatchObject({
            type: "Multi-Role",
            size: "medium",
            production_status: "flight-ready",
            description: "A versatile ship.",
            game_description: "In-game blurb."
        });
    });

    it("should map foci and drop entries whose en_EN is null", () => {
        const result = toVehicleWiki(rawVehicle({ foci: [loc("Exploration"), loc(null), loc("Cargo")] }));
        expect(result?.foci).toEqual(["Exploration", "Cargo"]);
    });

    it("should convert cargo grids to SCU units via metricToSCUCargoGrid", () => {
        const result = toVehicleWiki(
            rawVehicle({
                cargo_grids: [
                    {
                        uuid: "g1",
                        width: 2.5,
                        height: 1.25,
                        length: 5,
                        volume: 10,
                        scu: 8,
                        open: false,
                        external: false,
                        closed: false
                    }
                ]
            })
        );
        expect(result?.cargo_grids).toHaveLength(1);
        expect(result?.cargo_grids[0]).toMatchObject({ width: 2, height: 1, length: 4 });
    });

    it("should set max_scu_box to the largest box across cargo grids", () => {
        // Metric dims feed metricToSCUCargoGrid: 2.5^3 -> 8 SCU box, 2.5x2.5x10 -> 32 SCU box.
        const result = toVehicleWiki(
            rawVehicle({
                cargo_grids: [
                    {
                        uuid: "g1",
                        width: 2.5,
                        height: 2.5,
                        length: 2.5,
                        volume: 8,
                        scu: 8,
                        open: false,
                        external: false,
                        closed: false
                    },
                    {
                        uuid: "g2",
                        width: 2.5,
                        height: 2.5,
                        length: 10,
                        volume: 32,
                        scu: 32,
                        open: false,
                        external: false,
                        closed: false
                    }
                ]
            })
        );
        expect(result?.max_scu_box).toBe(32);
    });

    it("should set max_scu_box to 0 when there are no cargo grids", () => {
        expect(toVehicleWiki(rawVehicle())?.max_scu_box).toBe(0);
    });

    it("should pass uex_prices through when present", () => {
        const purchase = [{ price_buy: 100 }];
        const rental = [{ price_rent: 5 }];
        const result = toVehicleWiki(rawVehicle({ uex_prices: { purchase, rental } }));
        expect(result?.uex_prices).toEqual({ purchase, rental });
    });

    it("should apply empty/null defaults when optional fields are absent", () => {
        const result = toVehicleWiki(rawVehicle());
        expect(result).toMatchObject({
            foci: [],
            cargo_grids: [],
            crew: { min: null, max: null },
            uex_prices: { purchase: [], rental: [] },
            type: null,
            production_status: null
        });
        expect(result?.quantum).toEqual({
            quantum_speed: null,
            quantum_spool_time: null,
            quantum_fuel_capacity: null,
            quantum_range: null,
            port_olisar_to_arccorp_time: null,
            port_olisar_to_arccorp_fuel: null
        });
    });

    it("should map nested crew and quantum values when present", () => {
        const result = toVehicleWiki(
            rawVehicle({ crew: { min: 2, max: 5 }, quantum: { quantum_speed: 200_000, quantum_range: 5_000_000 } })
        );
        expect(result?.crew).toEqual({ min: 2, max: 5 });
        expect(result?.quantum).toMatchObject({ quantum_speed: 200_000, quantum_range: 5_000_000 });
    });
});
