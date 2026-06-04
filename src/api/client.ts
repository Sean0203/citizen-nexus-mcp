import {z} from "zod";

const BASE_URL = process.env.UEX_BASE_URL ?? "https://api.uexcorp.space/2.0";
const API_KEY = process.env.UEX_API_KEY;

// UEX 2.0 wraps every payload in this envelope. Confirm against a live
// response and adjust if the shape differs.
const envelopeSchema = z.object({
    status: z.string(),
    http_code: z.number().optional(),
    data: z.unknown(),
});

export class UexApiError extends Error {
}

/**
 * GET a UEX endpoint and return its `data` payload, typed by the caller.
 * Validation is limited to the envelope. Inner fields are accessed
 * defensively in projections, since the data is crowdsourced and often null.
 */
export async function uexGet<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
): Promise<T> {
    if (!API_KEY) throw new UexApiError("UEX_API_KEY is not set");

    const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";
    const url = new URL(path.replace(/^\//, ""), base);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }
    }

    const res = await fetch(url, {headers: {Authorization: `Bearer ${API_KEY}`}});
    if (!res.ok) {
        throw new UexApiError(`UEX request failed: ${res.status} ${res.statusText} (${url.pathname})`);
    }

    const parsed = envelopeSchema.safeParse(await res.json());
    if (!parsed.success) throw new UexApiError(`Unexpected envelope from ${url.pathname}`);
    if (parsed.data.status !== "ok") {
        throw new UexApiError(`UEX returned status "${parsed.data.status}" for ${url.pathname}`);
    }

    return parsed.data.data as T;
}
