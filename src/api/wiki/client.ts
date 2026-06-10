import { z } from "zod";
import { ApiError, httpGetJson } from "../http.js";
import type { components } from "./schema.js";

/**
 * Client for the star-citizen.wiki API (https://api.star-citizen.wiki).
 *
 * All endpoints used here are public and require no authentication, so no
 * Authorization header is ever sent. List responses are wrapped in a
 * { data, links, meta } envelope; this client unwraps it and exposes a helper
 * that walks every page so callers receive the full result set.
 */

export type GameVehicle = components["schemas"]["game_vehicle"];
type PaginationMeta = components["schemas"]["pagination_meta"];
type PaginationLinks = components["schemas"]["pagination_links"];

/** Largest page the API allows. Used to minimise the number of round trips. */
const MAX_PAGE_SIZE = 200;

export class WikiApiError extends ApiError {}

function getBaseUrl(): string {
    return process.env.WIKI_BASE_URL ?? "https://api.star-citizen.wiki";
}

/** Runtime check of just the fields paging depends on. The typed payload is
 *  cast to the generated schema after this passes. */
const listEnvelopeSchema = z.object({
    data: z.array(z.unknown()),
    meta: z
        .object({
            current_page: z.number().optional(),
            last_page: z.number().optional(),
            total: z.number().optional()
        })
        .passthrough()
        .optional()
});

export interface WikiList<T> {
    data: T[];
    links?: PaginationLinks;
    meta?: PaginationMeta;
}

export interface WikiListParams {
    /** 1-based page index. Defaults to the API default when omitted. */
    page?: number;
    /** Items per page. Capped by the API at 200. */
    pageSize?: number;
    /** Game version code to scope results. Omit to use the API default. */
    version?: string;
    /** filter[...] parameters, for example { name: "Cutlass" }. */
    filter?: Record<string, string | number>;
}

/** Builds the wiki query string, including the bracketed pagination and filter
 *  keys the API expects (page[number], page[size], filter[field]). */
function toQuery(params: WikiListParams): Record<string, string | number | undefined> {
    const query: Record<string, string | number | undefined> = {
        "page[number]": params.page,
        "page[size]": params.pageSize,
        version: params.version
    };
    if (params.filter) {
        for (const [field, value] of Object.entries(params.filter)) {
            query[`filter[${field}]`] = value;
        }
    }
    return query;
}

/** GET a single page of a wiki list endpoint and return its unwrapped envelope. */
export async function wikiGetList<T>(path: string, params: WikiListParams = {}): Promise<WikiList<T>> {
    const body = await httpGetJson({
        baseUrl: getBaseUrl(),
        path,
        query: toQuery(params),
        errorType: WikiApiError
    });

    const parsed = listEnvelopeSchema.safeParse(body);
    if (!parsed.success) throw new WikiApiError(`Unexpected list envelope from ${path}`);

    const envelope = body as WikiList<T>;
    return { data: envelope.data, links: envelope.links, meta: envelope.meta };
}

/**
 * GET every page of a wiki list endpoint and return the concatenated items.
 * Pages are fetched sequentially (to stay polite and well within rate limits)
 * at the maximum page size, looping until meta.current_page reaches
 * meta.last_page. If meta is absent, the first page is treated as complete.
 */
export async function wikiGetAll<T>(path: string, params: Omit<WikiListParams, "page" | "pageSize"> = {}): Promise<T[]> {
    const all: T[] = [];

    const first = await wikiGetList<T>(path, { ...params, page: 1, pageSize: MAX_PAGE_SIZE });
    all.push(...first.data);

    const lastPage = first.meta?.last_page ?? 1;
    for (let page = 2; page <= lastPage; page++) {
        const next = await wikiGetList<T>(path, { ...params, page, pageSize: MAX_PAGE_SIZE });
        all.push(...next.data);
    }

    return all;
}

/**
 * Fetch the full catalogue of in-game vehicles (ships and ground vehicles) from
 * GET /api/vehicles. Uses the endpoint's default includes (vehicle, manufacturer,
 * shipMatrixVehicle.loaner, skus). Trimming to the domain model and joining to
 * the UEX id happen in later layers.
 */
export async function getAllVehicles(version?: string): Promise<GameVehicle[]> {
    return wikiGetAll<GameVehicle>("/api/vehicles", { version });
}
