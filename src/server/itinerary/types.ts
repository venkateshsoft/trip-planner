import type {
  Coordinates,
  RouteResult,
  RouteTransportMode,
} from "@/server/providers/types";

export type OpeningWindow = {
  dayOfWeek: number;
  openMinute: number;
  closeMinute: number;
};

export type ItineraryCandidate = {
  id: string;
  name: string;
  location: Coordinates;
  rating?: number;
  interestTags: string[];
  estimatedVisitMinutes: number;
  estimatedCostMinor: number;
  openingHours?: OpeningWindow[];
};

export type ItineraryTrip = {
  id: string;
  startDate: Date;
  travelDays: number;
  startingLocation: string;
  transportMode: RouteTransportMode;
  totalBudgetMinor: number;
  hotelBudgetMinor: number;
  foodBudgetMinor: number;
  interests: string[];
};

export type MatrixKey = string;
export type TravelMatrix = Map<MatrixKey, RouteResult>;

export type GeneratedStop = ItineraryCandidate & {
  startMinute: number;
  endMinute: number;
  travelFromPrevious: RouteResult;
};

export type GeneratedDay = {
  dayNumber: number;
  date: Date;
  stops: GeneratedStop[];
  totalTravelSeconds: number;
  estimatedCostMinor: number;
};

export type GeneratedItinerary = {
  days: GeneratedDay[];
  totalEstimatedCostMinor: number;
  budgetRemainingMinor: number;
};

export function matrixKey(from: string, to: string): MatrixKey {
  return `${from}->${to}`;
}

