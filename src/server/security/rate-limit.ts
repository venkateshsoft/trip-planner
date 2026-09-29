export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export interface RateLimiter {
  check(key: string): RateLimitResult | Promise<RateLimitResult>;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<
    string,
    { startedAt: number; count: number }
  >();

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || now - current.startedAt >= this.windowMs) {
      this.buckets.set(key, { startedAt: now, count: 1 });
      return {
        allowed: true,
        remaining: Math.max(this.limit - 1, 0),
        retryAfterSeconds: Math.ceil(this.windowMs / 1000),
      };
    }
    if (current.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(
          (this.windowMs - (now - current.startedAt)) / 1000,
        ),
      };
    }
    current.count += 1;
    return {
      allowed: true,
      remaining: this.limit - current.count,
      retryAfterSeconds: Math.ceil(
        (this.windowMs - (now - current.startedAt)) / 1000,
      ),
    };
  }
}

export const apiRateLimiter = new InMemoryRateLimiter(
  Number(process.env.API_RATE_LIMIT_PER_MINUTE ?? 120),
);
export const aiRateLimiter = new InMemoryRateLimiter(
  Number(process.env.AI_RATE_LIMIT_PER_MINUTE ?? 20),
);

export class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly limit: number,
    private readonly windowSeconds = 60,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const baseUrl = this.baseUrl.replace(/\/$/, "");
    const encodedKey = encodeURIComponent(key);
    const response = await fetch(`${baseUrl}/incr/${encodedKey}`, {
      headers: { authorization: `Bearer ${this.token}` },
    });
    if (!response.ok)
      throw new Error(`Rate-limit store returned HTTP ${response.status}`);
    const payload = (await response.json()) as { result?: number };
    if (typeof payload.result !== "number")
      throw new Error("Rate-limit store returned an invalid result");
    if (payload.result === 1) {
      await fetch(`${baseUrl}/expire/${encodedKey}/${this.windowSeconds}`, {
        headers: { authorization: `Bearer ${this.token}` },
      });
    }
    return {
      allowed: payload.result <= this.limit,
      remaining: Math.max(this.limit - payload.result, 0),
      retryAfterSeconds: this.windowSeconds,
    };
  }
}

export function distributedRateLimiter(
  kind: "api" | "ai",
): RateLimiter | undefined {
  const url = process.env.RATE_LIMIT_REDIS_URL;
  const token = process.env.RATE_LIMIT_REDIS_TOKEN;
  if (!url || !token) return undefined;
  const prefix = kind === "api" ? "API" : "AI";
  return new UpstashRateLimiter(
    url,
    token,
    Number(
      process.env[`${prefix}_RATE_LIMIT_PER_MINUTE`] ??
        (kind === "api" ? 120 : 20),
    ),
  );
}

