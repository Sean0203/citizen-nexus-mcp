/**
 * Shared low-level HTTP transport for all API clients.
 *
 * It knows how to build a URL from a base plus path plus query, issue a GET,
 * verify the HTTP status, and parse the JSON body. It does NOT understand any
 * source-specific response envelope. Each client unwraps its own shape on top
 * of this ({ status, data } for UEX, { data, links, meta } for the wiki).
 */

/** Base class for every API client error, so callers can catch them uniformly. */
export class ApiError extends Error {}

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
    /** Extra request headers, for example an Authorization header. */
    headers?: Record<string, string>;
    /** Concrete error class to throw on failure. Defaults to ApiError. */
    errorType?: new (message: string) => ApiError;
}

/**
 * Issues a GET and returns the parsed JSON body as `unknown`.
 * Throws `errorType` on a network failure, a non-2xx response, or invalid JSON.
 */
export async function httpGetJson(options: HttpGetOptions): Promise<unknown> {
    const { baseUrl, path, query, headers, errorType = ApiError } = options;

    const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    const url = new URL(path.replace(/^\//, ""), base);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }
    }

    let res: Response;
    try {
        res = await fetch(url, headers ? { headers } : undefined);
    } catch (cause) {
        throw new errorType(`Network request to ${url.pathname} failed: ${String(cause)}`);
    }

    if (!res.ok) {
        throw new errorType(`Request failed: ${res.status} ${res.statusText} (${url.pathname})`);
    }

    try {
        return await res.json();
    } catch {
        throw new errorType(`Invalid JSON in response from ${url.pathname}`);
    }
}
