import { describe, expect, it, vi } from "vitest";
import { DiscoveryService } from "./service";

const place = (overrides: Record<string, unknown> = {}) => ({
  providerId: "place-1",
  name: "Sample Place",
  latitude: 35,
  longitude: 135,
  rating: 4.5,
  userRatingsTotal: 100,
  types: ["restaurant"],
  ...overrides,
});

describe("DiscoveryService", () => {
  it("normalizes and filters points of interest", async () => {
    const maps = {
      searchPlaces: vi
        .fn()
        .mockResolvedValue([place(), place({ providerId: "low", rating: 3 })]),
    };
    const results = await new DiscoveryService(maps as never).pointsOfInterest({
      query: "Kyoto",
      minRating: 4,
      limit: 10,
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "place-1",
      categories: ["restaurant"],
    });
  });

  it("filters hotels by normalized price level", async () => {
    const maps = {
      searchPlaces: vi.fn().mockResolvedValue([
        place({ priceLevel: "PRICE_LEVEL_MODERATE" }),
        place({
          providerId: "expensive",
          priceLevel: "PRICE_LEVEL_VERY_EXPENSIVE",
        }),
      ]),
    };
    const results = await new DiscoveryService(maps as never).hotels({
      query: "Kyoto",
      maxPriceLevel: 2,
    });
    expect(results).toHaveLength(1);
    expect(results[0].availability).toBe("unsupported");
  });
});

