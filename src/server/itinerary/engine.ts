import type { RouteResult } from "@/server/providers/types";
import {
  type GeneratedItinerary,
  type ItineraryCandidate,
  type ItineraryTrip,
  matrixKey,
  type TravelMatrix,
} from "./types";

export interface RouteProvider {
  route(
    origin: string | { latitude: number; longitude: number },
    destination: string | { latitude: number; longitude: number },
    mode: ItineraryTrip["transportMode"],
  ): Promise<RouteResult>;
}

const DAY_START_MINUTE = 9 * 60;
const DAY_END_MINUTE = 18 * 60;
const DEFAULT_OPEN_MINUTE = 9 * 60;
const DEFAULT_CLOSE_MINUTE = 18 * 60;

const transportCostPerKilometerMinor: Record<
  ItineraryTrip["transportMode"],
  number
> = {
  WALKING: 0,
  BICYCLING: 0,
  TRANSIT: 20,
  DRIVING: 35,
};

export async function buildTravelMatrix(
  trip: ItineraryTrip,
  candidates: ItineraryCandidate[],
  routes: RouteProvider,
): Promise<TravelMatrix> {
  const matrix: TravelMatrix = new Map();
  const nodes = [
    { id: "start", location: trip.startingLocation },
    ...candidates.map((candidate) => ({
      id: candidate.id,
      location: candidate.location,
    })),
  ];

  for (const from of nodes) {
    for (const to of nodes) {
      if (from.id === to.id) continue;
      const result = await routes.route(
        from.location,
        to.location,
        trip.transportMode,
      );
      matrix.set(matrixKey(from.id, to.id), result);
    }
  }
  return matrix;
}

function candidateScore(candidate: ItineraryCandidate, interests: string[]) {
  const normalizedInterests = new Set(
    interests.map((interest) => interest.toLowerCase()),
  );
  const matchingInterests = candidate.interestTags.filter((tag) =>
    normalizedInterests.has(tag.toLowerCase()),
  ).length;
  return matchingInterests * 10 + (candidate.rating ?? 0) * 2;
}

function getWindow(candidate: ItineraryCandidate, date: Date) {
  const dayOfWeek = date.getUTCDay();
  return (
    candidate.openingHours?.find(
      (window) => window.dayOfWeek === dayOfWeek,
    ) ?? {
      dayOfWeek,
      openMinute: DEFAULT_OPEN_MINUTE,
      closeMinute: DEFAULT_CLOSE_MINUTE,
    }
  );
}

function dateForDay(startDate: Date, dayOffset: number) {
  const date = new Date(startDate);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

function travelCostMinor(
  route: RouteResult,
  mode: ItineraryTrip["transportMode"],
) {
  return Math.round(
    (route.distanceMeters / 1000) * transportCostPerKilometerMinor[mode],
  );
}

export async function generateItinerary(
  trip: ItineraryTrip,
  candidates: ItineraryCandidate[],
  matrix: TravelMatrix,
): Promise<GeneratedItinerary> {
  const remaining = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const days: GeneratedItinerary["days"] = [];

  for (let dayIndex = 0; dayIndex < trip.travelDays; dayIndex += 1) {
    const date = dateForDay(trip.startDate, dayIndex);
    const stops: GeneratedItinerary["days"][number]["stops"] = [];
    let currentId = "start";
    let currentMinute = DAY_START_MINUTE;
    let totalTravelSeconds = 0;
    let estimatedCostMinor = Math.ceil(
      (trip.hotelBudgetMinor + trip.foodBudgetMinor) / trip.travelDays,
    );

    while (stops.length < 6 && remaining.size > 0) {
      const feasible = [...remaining.values()].flatMap((candidate) => {
        const route = matrix.get(matrixKey(currentId, candidate.id));
        if (!route) return [];
        const window = getWindow(candidate, date);
        const arrivalMinute =
          currentMinute + Math.ceil(route.durationSeconds / 60);
        const startMinute = Math.max(
          arrivalMinute,
          window.openMinute,
          DAY_START_MINUTE,
        );
        const endMinute = startMinute + candidate.estimatedVisitMinutes;
        if (
          startMinute >= window.closeMinute ||
          endMinute > window.closeMinute ||
          endMinute > DAY_END_MINUTE
        )
          return [];
        return [
          {
            candidate,
            route,
            startMinute,
            endMinute,
            score:
              candidateScore(candidate, trip.interests) -
              route.durationSeconds / 600,
          },
        ];
      });
      if (feasible.length === 0) break;
      feasible.sort((left, right) => right.score - left.score);
      const selected = feasible[0];
      const stop = {
        ...selected.candidate,
        startMinute: selected.startMinute,
        endMinute: selected.endMinute,
        travelFromPrevious: selected.route,
      };
      stops.push(stop);
      remaining.delete(selected.candidate.id);
      currentId = selected.candidate.id;
      currentMinute = selected.endMinute;
      totalTravelSeconds += selected.route.durationSeconds;
      estimatedCostMinor +=
        selected.candidate.estimatedCostMinor +
        travelCostMinor(selected.route, trip.transportMode);
    }

    days.push({
      dayNumber: dayIndex + 1,
      date,
      stops,
      totalTravelSeconds,
      estimatedCostMinor,
    });
  }

  const totalEstimatedCostMinor = days.reduce(
    (total, day) => total + day.estimatedCostMinor,
    0,
  );
  return {
    days,
    totalEstimatedCostMinor,
    budgetRemainingMinor: trip.totalBudgetMinor - totalEstimatedCostMinor,
  };
}

