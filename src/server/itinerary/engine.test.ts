import { describe, expect, it } from "vitest";
import {
  buildTravelMatrix,
  generateItinerary,
  type RouteProvider,
} from "./engine";
import type { ItineraryCandidate, ItineraryTrip } from "./types";

const trip: ItineraryTrip = {
  id: "trip-1",
  startDate: new Date("2027-04-01T00:00:00.000Z"),
  travelDays: 1,
  startingLocation: "Start",
  transportMode: "WALKING",
  totalBudgetMinor: 10_000,
  hotelBudgetMinor: 2_000,
  foodBudgetMinor: 2_000,
  interests: ["history"],
};

const candidates: ItineraryCandidate[] = [
  {
    id: "museum",
    name: "History Museum",
    location: { latitude: 35, longitude: 135 },
    rating: 4,
    interestTags: ["history"],
    estimatedVisitMinutes: 90,
    estimatedCostMinor: 500,
  },
  {
    id: "closed",
    name: "Closed Attraction",
    location: { latitude: 35.1, longitude: 135.1 },
    rating: 5,
    interestTags: ["history"],
    estimatedVisitMinutes: 90,
    estimatedCostMinor: 500,
    openingHours: [{ dayOfWeek: 4, openMinute: 1_140, closeMinute: 1_200 }],
  },
];

const routes: RouteProvider = {
  route: async () => ({
    distanceMeters: 1_000,
    durationSeconds: 600,
    provider: "test",
  }),
};

describe("itinerary engine", () => {
  it("builds a travel matrix and respects opening hours while scoring interests", async () => {
    const matrix = await buildTravelMatrix(trip, candidates, routes);
    const itinerary = await generateItinerary(trip, candidates, matrix);

    expect(matrix.size).toBe(6);
    expect(itinerary.days[0].stops.map((stop) => stop.id)).toEqual(["museum"]);
    expect(itinerary.totalEstimatedCostMinor).toBeGreaterThan(4_000);
    expect(itinerary.budgetRemainingMinor).toBeLessThan(trip.totalBudgetMinor);
  });
});

