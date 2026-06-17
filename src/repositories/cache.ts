import { createLogger } from "../logging/logger.js";

interface Entry {
    promise: Promise<unknown>;
    expires: number;
}

export const HOUR = 3_600_000;
export const MINUTE = 60_000;

/** In-memory TTL cache with single-flight loading: concurrent misses for the same key
 *  share one load() call. Lives for the duration of the server process. */
export class TtlCache {
    private store = new Map<string, Entry>();
    private log = createLogger("cache");

    get<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
        const hit = this.store.get(key);
        if (hit && hit.expires > Date.now()) {
            this.log.debug({ event: "cache_hit", key: key });
            return hit.promise as Promise<T>;
        }

        this.log.debug({ event: "cache_miss", key: key });
        const promise = load();
        const entry: Entry = { promise, expires: Date.now() + ttlMs };
        this.store.set(key, entry);

        // Drop the entry on failure so the next call retries instead of caching a rejection.
        promise.catch(() => {
            if (this.store.get(key) === entry) this.store.delete(key);
        });

        return promise as Promise<T>;
    }

    clear(key?: string): void {
        if (key) this.store.delete(key);
        else this.store.clear();
    }
}
