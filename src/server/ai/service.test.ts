import { describe, expect, it, vi } from "vitest";
import { AIPlanningService } from "./service";

describe("AIPlanningService", () => {
  it("extracts and validates structured preferences", async () => {
    const client = {
      structured: vi.fn().mockResolvedValue({
        interests: ["museums"],
        cuisines: [],
        pace: "balanced",
        hotelStarRating: null,
        transportPreference: null,
        constraints: [],
      }),
    };
    const result = await new AIPlanningService(
      client as never,
    ).extractPreferences("I like museums");
    expect(result.interests).toEqual(["museums"]);
  });

  it("drops explanations for unknown entity IDs", async () => {
    const client = {
      structured: vi.fn().mockResolvedValue({
        recommendations: [
          { entityId: "known", reason: "Good fit", caveats: [] },
          { entityId: "hallucinated", reason: "No", caveats: [] },
        ],
      }),
    };
    const result = await new AIPlanningService(
      client as never,
    ).explainRecommendations({
      preferences: "history",
      candidates: [{ id: "known", name: "Museum", categories: [] }],
    });
    expect(result.recommendations.map((item) => item.entityId)).toEqual([
      "known",
    ]);
  });

  it("turns unknown removal targets into a safe no-op", async () => {
    const client = {
      structured: vi.fn().mockResolvedValue({
        action: "remove",
        stopId: "missing",
        dayNumber: null,
        orderedStopIds: [],
        query: null,
        replaceStopId: null,
        explanation: "Remove it",
      }),
    };
    const result = await new AIPlanningService(
      client as never,
    ).interpretItineraryCommand({
      instruction: "remove the stop",
      itinerary: {
        days: [{ dayNumber: 1, stops: [{ id: "known", name: "Museum" }] }],
      },
    });
    expect(result.action).toBe("noop");
  });
});

