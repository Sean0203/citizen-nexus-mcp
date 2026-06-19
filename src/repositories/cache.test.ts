import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "./cache.js";

describe("TtlCache", () => {
    let cache: TtlCache;

    beforeEach(() => {
        cache = new TtlCache();
    });

    describe("hit / miss with TTL", () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it("should load once and serve cached value within TTL", async () => {
            const load = vi.fn().mockResolvedValue("v");

            expect(await cache.get("k", 1000, load)).toBe("v");
            expect(await cache.get("k", 1000, load)).toBe("v");

            expect(load).toHaveBeenCalledTimes(1);
        });

        it("should re-load after the TTL expires", async () => {
            const load = vi.fn().mockResolvedValue("v");

            await cache.get("k", 1000, load);
            vi.advanceTimersByTime(1001);
            await cache.get("k", 1000, load);

            expect(load).toHaveBeenCalledTimes(2);
        });

        it("should still serve the value at the last millisecond before expiry", async () => {
            const load = vi.fn().mockResolvedValue("v");

            await cache.get("k", 1000, load);
            vi.advanceTimersByTime(999);
            await cache.get("k", 1000, load);

            expect(load).toHaveBeenCalledTimes(1);
        });
    });

    describe("single-flight", () => {
        it("should share one load across concurrent misses", async () => {
            let resolve!: (v: string) => void;
            const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));

            const p1 = cache.get("k", 1000, load);
            const p2 = cache.get("k", 1000, load);
            resolve("v");

            expect(await p1).toBe("v");
            expect(await p2).toBe("v");
            expect(load).toHaveBeenCalledTimes(1);
        });
    });

    describe("rejection handling", () => {
        it("should not cache a failed load and should retry on the next call", async () => {
            const load = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce("v");

            await expect(cache.get("k", 1000, load)).rejects.toThrow("boom");
            expect(await cache.get("k", 1000, load)).toBe("v");
            expect(load).toHaveBeenCalledTimes(2);
        });

        it("should reject all concurrent callers sharing a failing load", async () => {
            const load = vi.fn().mockRejectedValue(new Error("boom"));

            const p1 = cache.get("k", 1000, load);
            const p2 = cache.get("k", 1000, load);

            await expect(p1).rejects.toThrow("boom");
            await expect(p2).rejects.toThrow("boom");
            expect(load).toHaveBeenCalledTimes(1);
        });
    });

    describe("clear", () => {
        it("should drop a single key, forcing a reload for only that key", async () => {
            const loadA = vi.fn().mockResolvedValue("a");
            const loadB = vi.fn().mockResolvedValue("b");

            await cache.get("a", 1000, loadA);
            await cache.get("b", 1000, loadB);
            cache.clear("a");
            await cache.get("a", 1000, loadA);
            await cache.get("b", 1000, loadB);

            expect(loadA).toHaveBeenCalledTimes(2);
            expect(loadB).toHaveBeenCalledTimes(1);
        });

        it("should drop all keys when called without an argument, forcing a reload for every key", async () => {
            const a = vi.fn().mockResolvedValue("a");
            const b = vi.fn().mockResolvedValue("b");

            await cache.get("a", 1000, a);
            await cache.get("b", 1000, b);
            cache.clear();
            await cache.get("a", 1000, a);
            await cache.get("b", 1000, b);

            expect(a).toHaveBeenCalledTimes(2);
            expect(b).toHaveBeenCalledTimes(2);
        });
    });
});
