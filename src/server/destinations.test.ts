import { describe, expect, it, vi } from "vitest";
import {
  DestinationResolver,
  normalizeDestinationKey,
  normalizeResolvedDestination,
} from "./destinations";

describe("destination normalization", () => {
  it("normalizes geocoder components into a destination", () => {
    expect(
      normalizeResolvedDestination(
        { tripId: "trip-1", city: "old", country: "old" },
        {
          formattedAddress: "Kyoto, Japan",
          latitude: 35.0116,
          longitude: 135.7681,
          city: "Kyoto",
          state: "Kyoto Prefecture",
          country: "Japan",
          placeId: "place-1",
        },
        {},
      ),
    ).toMatchObject({ city: "Kyoto", state: "Kyoto Prefecture", country: "Japan" });
  });

  it("uses a stable case and whitespace-insensitive key", () => {
    expect(normalizeDestinationKey({ city: " Kyoto ", state: "KYOTO", country: "Japan" }))
      .toBe("kyoto|kyoto|japan");
  });
});

describe("DestinationResolver", () => {
  it("returns the existing destination for a duplicate normalized location", async () => {
    const destination = { id: "destination-1", canonicalKey: "kyoto|kyoto|japan" };
    const database = {
      trip: { findUnique: vi.fn().mockResolvedValue({ id: "trip-1" }) },
      tripDestination: {
        findUnique: vi.fn().mockResolvedValue(destination),
        update: vi.fn().mockResolvedValue(destination),
        count: vi.fn(),
        create: vi.fn(),
      },
    };
    const result = await new DestinationResolver({
      database: database as never,
      maps: { geocode: vi.fn().mockResolvedValue(undefined) },
    }).resolve({ tripId: "trip-1", city: " Kyoto ", state: "KYOTO", country: "Japan" }, { geocode: false });

    expect(result.destinationId).toBe("destination-1");
    expect(database.tripDestination.create).not.toHaveBeenCalled();
  });
});

