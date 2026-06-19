import { z } from "zod";
import { ApiError, httpGetJson } from "../http.js";

// Read env lazily. The value may come from the MCP client
// config or from a local .env file (loaded by dotenv in the entry point). Reading inside the
// request guarantees it is present regardless of import/load order.
// The client config takes priority over the .env file.
function getBaseUrl(): string {
    return process.env.UEX_BASE_URL ?? "https://api.uexcorp.uk/2.0";
}

function getApiKey(): string {
    const bearer = process.env.UEX_BEARER_TOKEN;
    if (!bearer) {
        throw new UexApiError(
            "UEX_BEARER_TOKEN is not set. Provide it via your MCP client config (env block) or a .env file."
        );
    }
    return bearer;
}

// UEX 2.0 wraps every payload in this envelope.
const envelopeSchema = z.object({
    status: z.string(),
    http_code: z.number().optional(),
    data: z.unknown()
});

export class UexApiError extends ApiError {}

/**
 * GET a UEX endpoint and return its `data` payload, typed by the caller.
 * Validation is limited to the envelope. Inner fields are accessed
 * defensively in projections, since the data is crowdsourced and often null.
 */
export async function uexGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const body = await httpGetJson({
        baseUrl: getBaseUrl(),
        path,
        query,
        headers: { Authorization: `Bearer ${getApiKey()}` },
        errorType: UexApiError
    });

    const parsed = envelopeSchema.safeParse(body);
    if (!parsed.success) throw new UexApiError(`Unexpected envelope from ${path}`);
    if (parsed.data.status !== "ok") {
        throw new UexApiError(`UEX returned status "${parsed.data.status}" for ${path}`);
    }

    return parsed.data.data as T;
}
