import { ProviderRateLimitError } from "./errors";

export interface ProviderQuota {
  acquire(provider: string): void;
}

export class InMemoryProviderQuota implements ProviderQuota {
  private readonly windows = new Map<
    string,
    { startedAt: number; count: number }
  >();

  constructor(
    private readonly limit = Number(
      process.env.PROVIDER_RATE_LIMIT_PER_MINUTE ?? 60,
    ),
  ) {}

  acquire(provider: string) {
    const now = Date.now();
    const current = this.windows.get(provider);
    if (!current || now - current.startedAt >= 60_000) {
      this.windows.set(provider, { startedAt: now, count: 1 });
      return;
    }
    if (current.count >= this.limit) throw new ProviderRateLimitError(provider);
    current.count += 1;
  }
}

export const providerQuota = new InMemoryProviderQuota();

