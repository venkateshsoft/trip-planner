import { describe, expect, it } from "vitest";
import { extractMapCoordinates, normalizeGoogleMapsUrl } from "./maps";

describe("Google Maps URL handling", () => {
  it("accepts Google Maps links and extracts coordinate queries", () => {
    const url = normalizeGoogleMapsUrl(
      "https://www.google.com/maps/search/?api=1&query=35.0116,135.7681",
    );
    expect(url).toContain("google.com/maps");
    expect(extractMapCoordinates(url)).toEqual({
      latitude: 35.0116,
      longitude: 135.7681,
    });
  });

  it("rejects non-Google links", () => {
    expect(() => normalizeGoogleMapsUrl("https://example.com/place")).toThrow(
      "Google Maps link",
    );
  });
});

