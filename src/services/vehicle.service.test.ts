import { describe, expect, it, vi } from "vitest";
import type Fuse from "fuse.js";
import type { FuseResult, FuseResultMatch } from "fuse.js";
import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import { VehicleService } from "./vehicle.service.js";

function vehicle(slug: string, name: string = slug): VehicleWiki {
    return { slug, name } as unknown as VehicleWiki;
}

// A FuseResult with a controllable score and match coverage.
function result(item: VehicleWiki, score: number, matches?: FuseResultMatch[]): FuseResult<VehicleWiki> {
    return { item, refIndex: 0, score, matches };
}

// A match covering `covered` of `total` characters, to drive itemCoverage.
function match(covered: number, total: number): FuseResultMatch {
    return { indices: [[0, covered - 1]], value: "x".repeat(total), key: "name" };
}

// Fake repo whose index.search returns exactly the results we hand it.
function serviceReturning(results: FuseResult<VehicleWiki>[]) {
    const search = vi.fn().mockReturnValue(results);
    const index = { search } as unknown as Fuse<VehicleWiki>;
    const repo = { getVehicleIndex: vi.fn().mockResolvedValue(index) } as unknown as VehicleRepository;
    return { service: new VehicleService(repo), search };
}

describe("VehicleService.searchVehicles", () => {
    it("should trim the query before searching", async () => {
        const { service, search } = serviceReturning([]);

        await service.searchVehicles("  constellation  ");

        expect(search).toHaveBeenCalledWith("constellation");
    });

    it("should return the items from the search results", async () => {
        const { service } = serviceReturning([result(vehicle("a"), 0.1), result(vehicle("b"), 0.2)]);

        const items = await service.searchVehicles("x");

        expect(items.map((v) => v.slug)).toEqual(["a", "b"]);
    });

    it("should order by ascending Fuse score (lower is better)", async () => {
        const { service } = serviceReturning([
            result(vehicle("worse"), 0.5),
            result(vehicle("best"), 0.1),
            result(vehicle("mid"), 0.3)
        ]);

        const items = await service.searchVehicles("x");

        expect(items.map((v) => v.slug)).toEqual(["best", "mid", "worse"]);
    });

    it("should break score ties by higher match coverage", async () => {
        const { service } = serviceReturning([
            result(vehicle("low-cov"), 0.2, [match(1, 4)]), // 25% coverage
            result(vehicle("high-cov"), 0.2, [match(4, 4)]) // 100% coverage
        ]);

        const items = await service.searchVehicles("x");

        expect(items.map((v) => v.slug)).toEqual(["high-cov", "low-cov"]);
    });

    it("should break score+coverage ties by shorter slug", async () => {
        const { service } = serviceReturning([result(vehicle("longer"), 0.2), result(vehicle("ab"), 0.2)]);

        const items = await service.searchVehicles("x");

        expect(items.map((v) => v.slug)).toEqual(["ab", "longer"]);
    });

    it("should truncate to the result limit (10)", async () => {
        const results = Array.from({ length: 15 }, (_, i) => result(vehicle(`v${i}`), i / 100));
        const { service } = serviceReturning(results);

        const items = await service.searchVehicles("x");

        expect(items).toHaveLength(10);
        expect(items[0].slug).toBe("v0");
    });
});
