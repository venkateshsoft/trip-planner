import type { Coordinates, PlaceResult } from "@/server/providers/types";

export type DiscoverySource = "google-maps";

export type PointOfInterest = {
  id: string;
  name: string;
  address?: string;
  location: Coordinates;
  rating?: number;
  userRatingsTotal?: number;
  categories: string[];
  source: DiscoverySource;
};

export type Hotel = {
  id: string;
  name: string;
  address?: string;
  location: Coordinates;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  starRating?: number;
  requestedStarRating?: number;
  availability: "unsupported";
  source: DiscoverySource;
};

export type Restaurant = {
  id: string;
  name: string;
  address?: string;
  location: Coordinates;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  cuisines: string[];
  source: DiscoverySource;
};

export function priceLevelNumber(
  value: PlaceResult["priceLevel"],
): number | undefined {
  if (!value) return undefined;
  const levels: Record<NonNullable<PlaceResult["priceLevel"]>, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return levels[value];
}

