interface Entry<T> {
    value: T;
    expires: number;
}

export const HOUR = 3_600_000;
export const MINUTE = 60_000;

/** Simple in-memory TTL cache. Lives for the duration of the server process. */
export class TtlCache {
    private store = new Map<string, Entry<unknown>>();

    async get<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
        const hit = this.store.get(key);
        if (hit && hit.expires > Date.now()) return hit.value as T;

        const value = await load();
        this.store.set(key, {value, expires: Date.now() + ttlMs});
        return value;
    }

    clear(key?: string): void {
        if (key) this.store.delete(key);
        else this.store.clear();
    }
}
