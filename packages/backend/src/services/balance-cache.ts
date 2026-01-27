import type { BalanceIndex } from '@clever/shared';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
}

export class BalanceCache {
  private cache: Map<string, CacheEntry<BalanceIndex>>;
  private metrics: CacheMetrics;
  private defaultTTL: number;

  constructor(defaultTTL: number = 30000) {
    this.cache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    this.defaultTTL = defaultTTL;
  }

  get(clientId: string): BalanceIndex | null {
    const entry = this.cache.get(clientId);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(clientId);
      this.metrics.evictions++;
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return entry.data;
  }

  set(clientId: string, balance: BalanceIndex, ttl?: number): void {
    const entry: CacheEntry<BalanceIndex> = {
      data: balance,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(clientId, entry);
  }

  invalidate(clientId: string): void {
    const deleted = this.cache.delete(clientId);
    if (deleted) {
      this.metrics.evictions++;
    }
  }

  invalidateAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.metrics.evictions += size;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getCacheHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    if (total === 0) return 0;
    return (this.metrics.hits / total) * 100;
  }

  getSize(): number {
    return this.cache.size;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    let evicted = 0;

    for (const [clientId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(clientId);
        evicted++;
      }
    }

    this.metrics.evictions += evicted;
  }

  // Warm cache with frequently accessed balances
  async warmCache(
    clientIds: string[],
    fetchBalance: (clientId: string) => Promise<BalanceIndex | null>
  ): Promise<void> {
    const promises = clientIds.map(async clientId => {
      const balance = await fetchBalance(clientId);
      if (balance) {
        this.set(clientId, balance);
      }
    });

    await Promise.all(promises);
  }
}

// Global cache instance (singleton pattern for Worker)
let globalCache: BalanceCache | null = null;

export function getBalanceCache(): BalanceCache {
  if (!globalCache) {
    globalCache = new BalanceCache(30000); // 30 seconds TTL
  }
  return globalCache;
}
