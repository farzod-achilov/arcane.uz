/* ─────────────────────────────────────────────────────────
   In-memory TTL cache — shared across requests in one
   Next.js server instance. Used by every supplier integration
   (lib/digiseller, lib/kinguin, lib/eneba, lib/g2a, lib/gamivo),
   each instantiating its own singleton so cache keys never collide.
───────────────────────────────────────────────────────── */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // unix ms
}

export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix: string): void {
    Array.from(this.store.keys()).forEach(key => {
      if (key.startsWith(prefix)) this.store.delete(key);
    });
  }

  /** Remove all expired entries */
  purge(): void {
    const now = Date.now();
    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) this.store.delete(key);
    });
  }

  size(): number {
    return this.store.size;
  }
}
