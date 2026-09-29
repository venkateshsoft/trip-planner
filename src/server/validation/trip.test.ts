import { describe, expect, it } from "vitest";
import { tripInputSchema } from "./trip";

describe("tripInputSchema", () => {
  it("accepts a valid trip", () => {
    expect(
      tripInputSchema.safeParse({
        city: "Kyoto",
        country: "Japan",
        startingLocation: "Kyoto Station",
        transportMode: "TRANSIT",
        travelDays: 5,
        startDate: "2027-04-01",
        endDate: "2027-04-05",
        totalBudgetMinor: 200000,
        hotelBudgetMinor: 80000,
        foodBudgetMinor: 50000,
        travelerCount: 2,
      }).success,
    ).toBe(true);
  });

  it("rejects an inverted date range", () => {
    expect(
      tripInputSchema.safeParse({
        city: "Kyoto",
        country: "Japan",
        startingLocation: "Kyoto Station",
        transportMode: "TRANSIT",
        travelDays: 5,
        startDate: "2027-04-05",
        endDate: "2027-04-01",
        totalBudgetMinor: 200000,
        hotelBudgetMinor: 80000,
        foodBudgetMinor: 50000,
      }).success,
    ).toBe(false);
  });
});

