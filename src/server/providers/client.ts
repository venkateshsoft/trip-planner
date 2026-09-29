import { ProviderError } from "./errors";
import { PrismaProviderCache, type ProviderCache } from "./cache";
import type { ProviderFetch } from "./types";
import { InMemoryProviderQuota, type ProviderQuota } from "./quota";
import { logger } from "@/server/logger";
import { CircuitBreaker } from "./circuit-breaker";

export type ProviderClientOptions = {
  fetchImpl?: ProviderFetch;
  cache?: ProviderCache;
  quota?: ProviderQuota;
};

export abstract class ProviderClient {
  protected readonly fetchImpl: ProviderFetch;
  protected readonly cache: ProviderCache;
  protected readonly quota: ProviderQuota;
  private readonly circuitBreaker = new CircuitBreaker();

  protected constructor(
    protected readonly provider: string,
    options: ProviderClientOptions,
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.cache = options.cache ?? new PrismaProviderCache();
    this.quota = options.quota ?? new InMemoryProviderQuota();
  }

  protected async requestJson<T>(
    url: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<T> {
    this.quota.acquire(this.provider);
    if (!this.circuitBreaker.allow()) {
      throw new ProviderError(
        `${this.provider} is temporarily unavailable`,
        this.provider,
        503,
      );
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, init);
        if (response.ok) {
          this.circuitBreaker.recordSuccess();
          return (await response.json()) as T;
        }
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === 2) {
          throw new ProviderError(
            `${this.provider} returned HTTP ${response.status}`,
            this.provider,
            response.status,
          );
        }
      } catch (error) {
        if (
          error instanceof ProviderError &&
          error.status < 500 &&
          error.status !== 429
        )
          throw error;
        if (attempt === 2) {
          this.circuitBreaker.recordFailure();
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
    throw new ProviderError(`${this.provider} request failed`, this.provider);
  }

  protected async cached<T>(
    cacheKey: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ) {
    const cached = await this.cache.get<T>(this.provider, cacheKey);
    if (cached !== undefined) return cached;
    try {
      const value = await loader();
      await this.cache.set(this.provider, cacheKey, value, ttlSeconds);
      return value;
    } catch (error) {
      const stale = await this.cache.getStale<T>(this.provider, cacheKey);
      if (stale !== undefined) {
        logger.warn(
          { provider: this.provider, cacheKey },
          "Provider failed; serving stale cache",
        );
        return stale;
      }
      throw error;
    }
  }
}

