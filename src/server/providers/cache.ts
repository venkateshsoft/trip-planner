import { db } from "@/server/db";

export interface ProviderCache {
  get<T>(provider: string, cacheKey: string): Promise<T | undefined>;
  getStale<T>(provider: string, cacheKey: string): Promise<T | undefined>;
  set<T>(
    provider: string,
    cacheKey: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void>;
}

export class PrismaProviderCache implements ProviderCache {
  async get<T>(provider: string, cacheKey: string): Promise<T | undefined> {
    const entry = await db.providerCacheEntry.findUnique({
      where: { provider_cacheKey: { provider, cacheKey } },
    });
    if (!entry || entry.expiresAt <= new Date()) return undefined;
    return entry.payload as T;
  }

  async getStale<T>(
    provider: string,
    cacheKey: string,
  ): Promise<T | undefined> {
    const entry = await db.providerCacheEntry.findUnique({
      where: { provider_cacheKey: { provider, cacheKey } },
    });
    return entry?.payload as T | undefined;
  }

  async set<T>(
    provider: string,
    cacheKey: string,
    value: T,
    ttlSeconds: number,
  ) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await db.providerCacheEntry.upsert({
      where: { provider_cacheKey: { provider, cacheKey } },
      create: { provider, cacheKey, payload: value as object, expiresAt },
      update: { payload: value as object, expiresAt },
    });
  }
}

export class MemoryProviderCache implements ProviderCache {
  private readonly entries = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  async get<T>(provider: string, cacheKey: string) {
    const entry = this.entries.get(`${provider}:${cacheKey}`);
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.value as T;
  }

  async getStale<T>(provider: string, cacheKey: string) {
    return this.entries.get(`${provider}:${cacheKey}`)?.value as T | undefined;
  }

  async set<T>(
    provider: string,
    cacheKey: string,
    value: T,
    ttlSeconds: number,
  ) {
    this.entries.set(`${provider}:${cacheKey}`, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

