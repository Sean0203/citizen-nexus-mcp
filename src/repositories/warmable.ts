/** A component that can pre-load data into the cache at startup. */
export interface Warmable {
    warm(): Promise<void>;
}
