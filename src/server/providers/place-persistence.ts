import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import type { PlaceResult } from "./types";

function placeType(types: string[]) {
  if (types.includes("museum")) return "MUSEUM";
  if (types.includes("park")) return "PARK";
  if (types.includes("natural_feature")) return "NATURE";
  if (types.includes("amusement_park")) return "AMUSEMENT_PARK";
  if (types.includes("point_of_interest")) return "ATTRACTION";
  return "ATTRACTION";
}

export async function persistDiscoveredPlaces(
  destinationId: string,
  places: PlaceResult[],
) {
  const destination = await db.tripDestination.findUnique({
    where: { id: destinationId },
    select: { id: true },
  });
  if (!destination) throw new HttpError("Destination not found", 404);

  const uniquePlaces = [
    ...new Map(places.map((place) => [place.providerId, place])).values(),
  ];

  return db.$transaction(
    uniquePlaces.map((place) =>
      db.place.upsert({
        where: {
          destinationId_source_sourceId: {
            destinationId,
            source: "google-maps",
            sourceId: place.providerId,
          },
        },
        create: {
          destinationId,
          name: place.name,
          placeType: placeType(place.types),
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          rating: place.rating,
          reviewCount: place.userRatingsTotal,
          categories: place.types,
          source: "google-maps",
          sourceId: place.providerId,
        },
        update: {
          name: place.name,
          placeType: placeType(place.types),
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          rating: place.rating,
          reviewCount: place.userRatingsTotal,
          categories: place.types,
        },
      }),
    ),
  );
}

