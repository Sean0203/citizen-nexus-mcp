import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the transport so no real HTTP happens. The client is the unit under test.
vi.mock("../http.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../http.js")>();
    return { ...actual, httpGetJson: vi.fn() };
});

import { httpGetJson } from "../http.js";
import { WikiApiError, wikiGetAll, wikiGetList } from "./client.js";

const mockHttp = vi.mocked(httpGetJson);

// A valid list envelope with the meta fields paging reads.
function envelope(data: unknown[], meta?: { current_page?: number; last_page?: number; total?: number }) {
    return { data, links: {}, meta };
}

// A WikiApiError carrying an HTTP status, as httpGetJson would throw.
function httpError(status: number): WikiApiError {
    const err = new WikiApiError(`Request failed: ${status}`);
    err.status = status;
    return err;
}

describe("wikiGetList", () => {
    beforeEach(() => {
        mockHttp.mockReset();
    });

    it("should unwrap the envelope into { data, links, meta }", async () => {
        mockHttp.mockResolvedValue(envelope([{ id: 1 }], { current_page: 1, last_page: 1 }));

        const result = await wikiGetList("/api/vehicles");

        expect(result.data).toEqual([{ id: 1 }]);
        expect(result.meta).toEqual({ current_page: 1, last_page: 1 });
    });

    it("should build bracketed pagination and filter query keys", async () => {
        mockHttp.mockResolvedValue(envelope([]));

        await wikiGetList("/api/vehicles", { page: 2, pageSize: 50, version: "4.0", filter: { name: "Cutlass" } });

        expect(mockHttp).toHaveBeenCalledWith(
            expect.objectContaining({
                query: expect.objectContaining({
                    "page[number]": 2,
                    "page[size]": 50,
                    version: "4.0",
                    "filter[name]": "Cutlass"
                })
            })
        );
    });

    it("should throw WikiApiError when the envelope shape is invalid", async () => {
        mockHttp.mockResolvedValue({ notData: true });

        await expect(wikiGetList("/api/vehicles")).rejects.toBeInstanceOf(WikiApiError);
    });

    describe("429 retry", () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it("should retry after a 429 and succeed", async () => {
            mockHttp.mockRejectedValueOnce(httpError(429)).mockResolvedValueOnce(envelope([{ id: 1 }]));

            const promise = wikiGetList("/api/vehicles");
            await vi.advanceTimersByTimeAsync(1000); // first backoff
            const result = await promise;

            expect(result.data).toEqual([{ id: 1 }]);
            expect(mockHttp).toHaveBeenCalledTimes(2);
        });

        it("should give up after MAX_RETRIES_429 and rethrow the 429", async () => {
            mockHttp.mockRejectedValue(httpError(429));

            const promise = wikiGetList("/api/vehicles");
            // eslint-disable-next-line vitest/valid-expect -- assertion is awaited below, after fake timers advance
            const assertion = expect(promise).rejects.toMatchObject({ status: 429 });
            await vi.advanceTimersByTimeAsync(1000 + 2000 + 3000); // three linear backoffs
            await assertion;

            expect(mockHttp).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
        });

        it("should not retry on a non-429 error", async () => {
            mockHttp.mockRejectedValue(httpError(500));

            await expect(wikiGetList("/api/vehicles")).rejects.toMatchObject({ status: 500 });
            expect(mockHttp).toHaveBeenCalledTimes(1);
        });
    });
});

describe("wikiGetAll", () => {
    beforeEach(() => {
        mockHttp.mockReset();
    });

    it("should return the first page's data when there is a single page", async () => {
        mockHttp.mockResolvedValue(envelope([{ id: 1 }, { id: 2 }], { current_page: 1, last_page: 1 }));

        const result = await wikiGetAll("/api/vehicles");

        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    it("should concatenate items across all pages", async () => {
        mockHttp
            .mockResolvedValueOnce(envelope([{ id: 1 }], { current_page: 1, last_page: 3 }))
            .mockResolvedValueOnce(envelope([{ id: 2 }], { current_page: 2, last_page: 3 }))
            .mockResolvedValueOnce(envelope([{ id: 3 }], { current_page: 3, last_page: 3 }));

        const result = await wikiGetAll("/api/vehicles");

        expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
        expect(mockHttp).toHaveBeenCalledTimes(3);
    });

    it("should treat a missing meta as a single complete page", async () => {
        mockHttp.mockResolvedValue(envelope([{ id: 1 }]));

        const result = await wikiGetAll("/api/vehicles");

        expect(result).toEqual([{ id: 1 }]);
        expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    it("should request page 1 at the max page size", async () => {
        mockHttp.mockResolvedValue(envelope([], { current_page: 1, last_page: 1 }));

        await wikiGetAll("/api/vehicles", { version: "4.0" });

        expect(mockHttp).toHaveBeenCalledWith(
            expect.objectContaining({
                query: expect.objectContaining({ "page[number]": 1, "page[size]": 200, version: "4.0" })
            })
        );
    });
});
