/**
 * Shared low-level HTTP transport for all API clients.
 *
 * It knows how to build a URL from a base plus path plus query, issue a GET,
 * verify the HTTP status, and parse the JSON body. It does NOT understand any
 * source-specific response envelope. Each client unwraps its own shape on top
 * of this ({ status, data } for UEX, { data, links, meta } for the wiki).
 */

/** Base class for every API client error, so callers can catch them uniformly. */
export class ApiError extends Error {
    /** HTTP status code, when the failure was a non-2xx response. */
    status?: number;
}

/** Default request timeout. Overridable per call via HttpGetOptions.timeoutMs. */
const DEFAULT_TIMEOUT_MS = 15_000;

/** Identifies this client to community APIs. Update the URL to the published repo. */
const USER_AGENT = "citizen-nexus-mcp/0.1.0 (+https://github.com/Sean0203/citizen-nexus-mcp)";

export interface HttpGetOptions {
    /** Absolute base URL, with or without a trailing slash. */
    baseUrl: string;
    /** Endpoint path. A leading slash is optional; it is resolved against baseUrl. */
    path: string;
    /**
     * Query parameters. Undefined values are skipped. Keys are written verbatim,
     * so bracketed keys such as "page[number]" are passed through unchanged
     * (URLSearchParams percent-encodes the brackets, which servers decode back).
     */
    query?: Record<string, string | number | boolean | undefined>;
    /** Extra request headers, for example an Authorization header. Overrides defaults. */
    headers?: Record<string, string>;
    /** Concrete error class to throw on failure. Defaults to ApiError. */
    errorType?: new (message: string) => ApiError;
    timeoutMs?: number;
}

/**
 * Issues a GET and returns the parsed JSON body as `unknown`.
 * Throws `errorType` on a network failure, a timeout, a non-2xx response, or invalid JSON.
 * On a non-2xx response the thrown error carries the HTTP `status`.
 */
export async function httpGetJson(options: HttpGetOptions): Promise<unknown> {
    const { baseUrl, path, query, headers, errorType = ApiError, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    const url = new URL(path.replace(/^\//, ""), base);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }
    }

    let res: Response;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": USER_AGENT, ...headers },
            signal: AbortSignal.timeout(timeoutMs)
        });
    } catch (cause) {
        const timedOut = cause instanceof Error && cause.name === "TimeoutError";
        const reason = timedOut ? `timed out after ${timeoutMs}ms` : `failed: ${String(cause)}`;
        throw new errorType(`Network request to ${url.pathname} ${reason}`);
    }

    if (!res.ok) {
        const err = new errorType(`Request failed: ${res.status} ${res.statusText} (${url.pathname})`);
        err.status = res.status;
        throw err;
    }

    try {
        return await res.json();
    } catch {
        throw new errorType(`Invalid JSON in response from ${url.pathname}`);
    }
}
