import type { TransportMode } from "@prisma/client";

export type Coordinates = { latitude: number; longitude: number };

export type GeocodedLocation = Coordinates & {
  formattedAddress: string;
  placeId?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type PlaceResult = Coordinates & {
  providerId: string;
  name: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?:
    | "PRICE_LEVEL_FREE"
    | "PRICE_LEVEL_INEXPENSIVE"
    | "PRICE_LEVEL_MODERATE"
    | "PRICE_LEVEL_EXPENSIVE"
    | "PRICE_LEVEL_VERY_EXPENSIVE";
  types: string[];
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  provider: string;
};

export type WeatherDay = {
  date: string;
  weatherCode: number;
  temperatureMinC: number;
  temperatureMaxC: number;
  precipitationProbability: number;
};

export type ProviderFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;
export type RouteTransportMode =
  Exclude<TransportMode, "BICYCLING"> | "BICYCLING";

