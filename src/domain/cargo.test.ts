import { describe, expect, it } from "vitest";
import { CargoGrid } from "./wiki-vehicle.models.js";
import { metricToSCUCargoGrid } from "./cargo.js";

// CargoGrid factory with sensible defaults; override only what a test cares about.
function grid(overrides: Partial<CargoGrid> = {}): CargoGrid {
    return {
        uuid: "test-uuid",
        width: 1.25,
        height: 1.25,
        length: 1.25,
        volume: 1,
        scu: 1,
        open: true,
        external: false,
        closed: false,
        max_scu_box: 0,
        ...overrides
    };
}

describe("metricToSCUCargoGrid", () => {
    it("should convert metric dimensions to SCU units (divide by 1.25)", () => {
        const result = metricToSCUCargoGrid(grid({ width: 2.5, height: 1.25, length: 5 }));
        expect(result.width).toBe(2);
        expect(result.height).toBe(1);
        expect(result.length).toBe(4);
    });

    it("should preserve passthrough fields", () => {
        const result = metricToSCUCargoGrid(
            grid({ uuid: "abc", volume: 42, scu: 7, open: true, external: false, closed: false })
        );
        expect(result).toMatchObject({ uuid: "abc", volume: 42, scu: 7, open: true, external: false, closed: false });
    });

    it.each([
        { name: "1 SCU with exactly 1 SCU dimensions", width: 1.25, height: 1.25, length: 1.25, expected: 1 },
        { name: "8 SCU with exactly 8 SCU dimensions", width: 2.5, height: 2.5, length: 2.5, expected: 8 },
        { name: "32 SCU with exactly 32 SCU dimensions", width: 2.5, height: 2.5, length: 10, expected: 32 },
        { name: "24 SCU with just short of 32 SCU dimensions", width: 2.5, height: 2.5, length: 9.875, expected: 24 },
        { name: "0 SCU with 0 SCU dimensions", width: 0.0, height: 0.0, length: 0.0, expected: 0 },
        { name: "32 SCU with >32 SCU dimensions", width: 5, height: 5, length: 20, expected: 32 },
        { name: "4 SCU with 8 SCU capacity but awkward dimensions", width: 5, height: 1.25, length: 2.5, expected: 4 }
    ])("should compute max_scu_box to $name", ({ width, height, length, expected }) => {
        const result = metricToSCUCargoGrid(grid({ width, height, length }));
        expect(result.max_scu_box).toBe(expected);
    });

    it("should ignore axis order (a box may be rotated to fit)", () => {
        // Long axis on width instead of length; sorted footprint still matches the 32 box.
        const result = metricToSCUCargoGrid(grid({ width: 10, height: 2.5, length: 2.5 }));
        expect(result.max_scu_box).toBe(32);
    });
});
