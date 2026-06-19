import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, httpGetJson } from "./http.js";

// Build a Response-like stub. Only the fields httpGetJson reads are provided.
function response(body: unknown, init: { ok?: boolean; status?: number; statusText?: string; badJson?: boolean } = {}) {
    const { ok = true, status = 200, statusText = "OK", badJson = false } = init;
    return {
        ok,
        status,
        statusText,
        json: badJson ? () => Promise.reject(new Error("bad json")) : () => Promise.resolve(body)
    } as unknown as Response;
}

// The single fetch mock the suite drives.
const fetchMock = vi.fn();

describe("httpGetJson", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function lastUrl(): URL {
        return fetchMock.mock.calls[0][0] as URL;
    }

    function lastInit(): RequestInit {
        return fetchMock.mock.calls[0][1] as RequestInit;
    }

    describe("URL building", () => {
        it("should join base and path and return the parsed body", async () => {
            fetchMock.mockResolvedValue(response({ ok: 1 }));

            const body = await httpGetJson({ baseUrl: "https://api.test", path: "vehicles" });

            expect(body).toEqual({ ok: 1 });
            expect(lastUrl().toString()).toBe("https://api.test/vehicles");
        });

        it("should tolerate a trailing slash on base and a leading slash on path", async () => {
            fetchMock.mockResolvedValue(response({}));

            await httpGetJson({ baseUrl: "https://api.test/", path: "/vehicles" });

            expect(lastUrl().toString()).toBe("https://api.test/vehicles");
        });

        it("should append query params, skip undefined, and stringify primitives", async () => {
            fetchMock.mockResolvedValue(response({}));

            await httpGetJson({
                baseUrl: "https://api.test",
                path: "vehicles",
                query: { page: 2, active: true, skip: undefined }
            });

            const url = lastUrl();
            expect(url.searchParams.get("page")).toBe("2");
            expect(url.searchParams.get("active")).toBe("true");
            expect(url.searchParams.has("skip")).toBe(false);
        });

        it("should pass bracketed keys through (percent-encoded)", async () => {
            fetchMock.mockResolvedValue(response({}));

            await httpGetJson({ baseUrl: "https://api.test", path: "v", query: { "page[number]": 1 } });

            expect(lastUrl().searchParams.get("page[number]")).toBe("1");
        });
    });

    describe("headers", () => {
        it("should send the default User-Agent", async () => {
            fetchMock.mockResolvedValue(response({}));

            await httpGetJson({ baseUrl: "https://api.test", path: "v" });

            const headers = lastInit().headers as Record<string, string>;
            expect(headers["User-Agent"]).toContain("citizen-nexus-mcp/");
        });

        it("should merge caller headers and let them override the default", async () => {
            fetchMock.mockResolvedValue(response({}));

            await httpGetJson({
                baseUrl: "https://api.test",
                path: "v",
                headers: { Authorization: "Bearer x", "User-Agent": "custom" }
            });

            const headers = lastInit().headers as Record<string, string>;
            expect(headers.Authorization).toBe("Bearer x");
            expect(headers["User-Agent"]).toBe("custom");
        });
    });

    describe("timeout", () => {
        it("should pass an abort signal to fetch", async () => {
            fetchMock.mockResolvedValue(response({}));

            await httpGetJson({ baseUrl: "https://api.test", path: "v" });

            expect(lastInit().signal).toBeInstanceOf(AbortSignal);
        });

        it("should report a timeout distinctly when fetch aborts with TimeoutError", async () => {
            const timeout = new Error("aborted");
            timeout.name = "TimeoutError";
            fetchMock.mockRejectedValue(timeout);

            await expect(httpGetJson({ baseUrl: "https://api.test", path: "v", timeoutMs: 5000 })).rejects.toThrow(
                /timed out after 5000ms/
            );
        });
    });

    describe("error branches", () => {
        it("should throw a generic message on a non-timeout network failure", async () => {
            fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

            await expect(httpGetJson({ baseUrl: "https://api.test", path: "v" })).rejects.toThrow(/failed/);
        });

        it("should throw with the HTTP status attached on a non-2xx response", async () => {
            fetchMock.mockResolvedValue(response(null, { ok: false, status: 429, statusText: "Too Many Requests" }));

            const err = await httpGetJson({ baseUrl: "https://api.test", path: "v" }).catch((e) => e);
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).status).toBe(429);
        });

        it("should throw on invalid JSON in a 2xx response", async () => {
            fetchMock.mockResolvedValue(response(null, { badJson: true }));

            await expect(httpGetJson({ baseUrl: "https://api.test", path: "v" })).rejects.toThrow(/Invalid JSON/);
        });

        it("should throw the provided errorType subclass", async () => {
            class WikiError extends ApiError {}
            fetchMock.mockResolvedValue(response(null, { ok: false, status: 500, statusText: "Server Error" }));

            const err = await httpGetJson({ baseUrl: "https://api.test", path: "v", errorType: WikiError }).catch(
                (e) => e
            );
            expect(err).toBeInstanceOf(WikiError);
            expect((err as WikiError).status).toBe(500);
        });
    });
});
