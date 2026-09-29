import { GoogleMapsProvider } from "@/server/providers/google-maps";
import type { Coordinates, PlaceResult } from "@/server/providers/types";
import {
  priceLevelNumber,
  type Hotel,
  type PointOfInterest,
  type Restaurant,
} from "./types";

export type DiscoveryOptions = {
  query: string;
  location?: Coordinates;
  limit?: number;
  minRating?: number;
};

function filterPlaces(places: PlaceResult[], options: DiscoveryOptions) {
  return places
    .filter(
      (place) =>
        options.minRating === undefined ||
        (place.rating ?? 0) >= options.minRating,
    )
    .slice(0, options.limit ?? 20);
}

function toPointOfInterest(place: PlaceResult): PointOfInterest {
  return {
    id: place.providerId,
    name: place.name,
    address: place.address,
    location: { latitude: place.latitude, longitude: place.longitude },
    rating: place.rating,
    userRatingsTotal: place.userRatingsTotal,
    categories: place.types,
    source: "google-maps",
  };
}

export class DiscoveryService {
  constructor(private readonly maps = new GoogleMapsProvider()) {}

  async pointsOfInterest(
    options: DiscoveryOptions,
  ): Promise<PointOfInterest[]> {
    const places = await this.maps.searchPlaces(
      `${options.query} tourist attractions`,
      options.location,
      "tourist_attraction",
    );
    return filterPlaces(places, options).map(toPointOfInterest);
  }

  async hotels(
    options: DiscoveryOptions & {
      maxPriceLevel?: number;
      preferredStarRating?: number;
    },
  ): Promise<Hotel[]> {
    const starQuery = options.preferredStarRating
      ? `${options.preferredStarRating} star `
      : "";
    const places = await this.maps.searchPlaces(
      `${starQuery}${options.query} hotels`,
      options.location,
      "lodging",
    );
    return filterPlaces(places, options)
      .filter(
        (place) =>
          options.maxPriceLevel === undefined ||
          (priceLevelNumber(place.priceLevel) ?? Number.POSITIVE_INFINITY) <=
            options.maxPriceLevel,
      )
      .map((place) => ({
        id: place.providerId,
        name: place.name,
        address: place.address,
        location: { latitude: place.latitude, longitude: place.longitude },
        rating: place.rating,
        userRatingsTotal: place.userRatingsTotal,
        priceLevel: priceLevelNumber(place.priceLevel),
        starRating: undefined,
        requestedStarRating: options.preferredStarRating,
        availability: "unsupported" as const,
        source: "google-maps" as const,
      }))
      .slice(0, options.limit ?? 20);
  }

  async restaurants(
    options: DiscoveryOptions & { cuisine?: string; maxPriceLevel?: number },
  ): Promise<Restaurant[]> {
    const cuisine = options.cuisine?.trim();
    const query = `${cuisine ? `${cuisine} ` : ""}restaurants in ${options.query}`;
    const places = await this.maps.searchPlaces(
      query,
      options.location,
      "restaurant",
    );
    return filterPlaces(places, options)
      .filter(
        (place) =>
          options.maxPriceLevel === undefined ||
          (priceLevelNumber(place.priceLevel) ?? Number.POSITIVE_INFINITY) <=
            options.maxPriceLevel,
      )
      .map((place) => ({
        id: place.providerId,
        name: place.name,
        address: place.address,
        location: { latitude: place.latitude, longitude: place.longitude },
        rating: place.rating,
        userRatingsTotal: place.userRatingsTotal,
        priceLevel: priceLevelNumber(place.priceLevel),
        cuisines: cuisine ? [cuisine] : [],
        source: "google-maps" as const,
      }))
      .slice(0, options.limit ?? 20);
  }
}

