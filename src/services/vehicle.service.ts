import type { VehicleRepository } from "../repositories/vehicle.repository.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import Fuse, { IFuseOptions, FuseResult, FuseResultMatch } from "fuse.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("vehicle.service");

const VEHICLE_MAX_SEARCH_RESULTS = 10;

const FUSE_OPTIONS: IFuseOptions<VehicleWiki> = {
    keys: ["name", "game_name", "slug"],
    threshold: 0.3, // Light typos,
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    ignoreDiacritics: true,
    minMatchCharLength: 2
};

const SCORE_EPSILON = 1e-6;

/** Whole-item coverage: total matched characters across all matched fields over total field length. */
function itemCoverage(matches: readonly FuseResultMatch[]): number {
    let matched = 0;
    let total = 0;
    for (const m of matches) {
        matched += m.indices.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
        total += m.value?.length ?? 0;
    }
    return total === 0 ? 0 : matched / total;
}

/** Comparator: keep Fuse's score order, but break score ties by higher match coverage (then shorter slug). */
function compareResults(a: FuseResult<VehicleWiki>, b: FuseResult<VehicleWiki>): number {
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    if (Math.abs(scoreA - scoreB) > SCORE_EPSILON) return scoreA - scoreB;

    const covA = itemCoverage(a.matches ?? []);
    const covB = itemCoverage(b.matches ?? []);
    if (Math.abs(covA - covB) > SCORE_EPSILON) return covB - covA; // higher coverage first

    return (a.item.slug?.length ?? 0) - (b.item.slug?.length ?? 0); // deterministic fallback
}

/** Business logic for vehicles: fuzzy name search over the cached wiki data. */
export class VehicleService {
    private fuse: Fuse<VehicleWiki> | null = null;

    constructor(private repo: VehicleRepository) {}

    private async getIndex(): Promise<Fuse<VehicleWiki>> {
        if (this.fuse) return this.fuse;
        const vehicles = await this.repo.getAllVehiclesWiki();
        this.fuse = new Fuse(vehicles, FUSE_OPTIONS);
        log.info({ event: "index_built", count: vehicles.length });
        return this.fuse;
    }

    /** Fuzzy-search vehicles, re-sorting score ties by match coverage before truncating to the result limit. */
    async searchVehicles(query: string): Promise<VehicleWiki[]> {
        const fuse = await this.getIndex();
        const results = fuse.search(query.trim());
        const items = results
            .sort(compareResults)
            .slice(0, VEHICLE_MAX_SEARCH_RESULTS)
            .map((res) => res.item);
        log.debug({ event: "search", query, results: items.length });
        return items;
    }
}
