import { z } from "zod";

// Read env lazily, not at module load. The value may come from the MCP client
// config (injected into process.env when the client spawns the server) or from
// a local .env file (loaded by dotenv in the entry point). Reading inside the
// request guarantees it is present regardless of import/load order.
function getBaseUrl(): string {
    return process.env.UEX_BASE_URL ?? "https://api.uexcorp.uk/2.0";
}

function getApiKey(): string {
    const key = process.env.UEX_API_KEY;
    if (!key) {
        throw new UexApiError(
            "UEX_API_KEY is not set. Provide it via your MCP client config (env block) or a .env file."
        );
    }
    return key;
}

// UEX 2.0 wraps every payload in this envelope. Confirm against a live
// response and adjust if the shape differs.
const envelopeSchema = z.object({
    status: z.string(),
    http_code: z.number().optional(),
    data: z.unknown()
});

export class UexApiError extends Error {}

/**
 * GET a UEX endpoint and return its `data` payload, typed by the caller.
 * Validation is limited to the envelope. Inner fields are accessed
 * defensively in projections, since the data is crowdsourced and often null.
 */
export async function uexGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const apiKey = getApiKey();

    const base = getBaseUrl();
    const baseUrl = base.endsWith("/") ? base : base + "/";
    const url = new URL(path.replace(/^\//, ""), baseUrl);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }
    }

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
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
