import { describe, expect, it } from "vitest";
import { CargoGrid } from "./wiki-vehicle.models.js";
import { metricToSCUCargoGrid } from "./cargo.js";

// Factory: a metric grid with sensible defaults; override only what a test cares about.
// Mirror this to your real CargoGrid type if fields differ.
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
        closed: true,
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
});
