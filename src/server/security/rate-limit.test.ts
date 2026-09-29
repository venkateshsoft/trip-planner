import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "./rate-limit";

describe("InMemoryRateLimiter", () => {
  it("blocks requests after the configured window limit", () => {
    const limiter = new InMemoryRateLimiter(2, 60_000);
    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client").allowed).toBe(false);
  });

  it("keeps buckets isolated by key", () => {
    const limiter = new InMemoryRateLimiter(1, 60_000);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
  });
});

