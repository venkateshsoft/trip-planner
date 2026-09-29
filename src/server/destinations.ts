import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import { extractMapCoordinates, normalizeGoogleMapsUrl } from "@/server/maps";
import { GoogleMapsProvider } from "@/server/providers/google-maps";
import type { GeocodedLocation } from "@/server/providers/types";

export type DestinationInput = {
  tripId: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  googleMapsUrl?: string;
};

type ResolverOptions = {
  maps?: Pick<GoogleMapsProvider, "geocode">;
  database?: typeof db;
};

type ResolveOptions = { geocode?: boolean };

export function normalizeDestinationKey(input: {
  city: string;
  state?: string | null;
  country: string;
}) {
  return [input.city, input.state ?? "", input.country]
    .map((part) => part.trim().normalize("NFKC").toLocaleLowerCase())
    .join("|");
}

export class DestinationResolver {
  private readonly maps: Pick<GoogleMapsProvider, "geocode">;
  private readonly database: typeof db;

  constructor(options: ResolverOptions = {}) {
    this.maps = options.maps ?? new GoogleMapsProvider();
    this.database = options.database ?? db;
  }

  async resolve(input: DestinationInput, options: ResolveOptions = {}) {
    const trip = await this.database.trip.findUnique({ where: { id: input.tripId } });
    if (!trip) throw new HttpError("Trip not found", 404);

    const googleMapsUrl = normalizeGoogleMapsUrl(input.googleMapsUrl);
    const coordinates = extractMapCoordinates(googleMapsUrl);
    const query = input.location ??
      ([input.city, input.state, input.country].filter(Boolean).join(", ") ||
        (googleMapsUrl && coordinates.latitude === undefined ? googleMapsUrl : undefined));
    const geocoded = options.geocode === false ? undefined : (query || coordinates.latitude !== undefined)
      ? await this.maps.geocode(query ?? `${coordinates.latitude},${coordinates.longitude}`)
      : undefined;
    const normalized = normalizeResolvedDestination(input, geocoded, coordinates);
    const canonicalKey = normalizeDestinationKey(normalized);

    const existing = await this.database.tripDestination.findUnique({
      where: { tripId_canonicalKey: { tripId: input.tripId, canonicalKey } },
    });
    if (existing) {
      const destination = await this.database.tripDestination.update({
        where: { id: existing.id },
        data: destinationData(normalized, canonicalKey),
      });
      return { destinationId: destination.id, destination };
    }

    const sequence = (await this.database.tripDestination.count({ where: { tripId: input.tripId } })) + 1;
    try {
      const destination = await this.database.tripDestination.create({
        data: { tripId: input.tripId, sequence, ...destinationData(normalized, canonicalKey) },
      });
      return { destinationId: destination.id, destination };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const destination = await this.database.tripDestination.findUniqueOrThrow({
          where: { tripId_canonicalKey: { tripId: input.tripId, canonicalKey } },
        });
        return { destinationId: destination.id, destination };
      }
      throw error;
    }
  }
}

export function normalizeResolvedDestination(
  input: DestinationInput,
  geocoded: GeocodedLocation | undefined,
  coordinates: { latitude?: number; longitude?: number },
) {
  const city = geocoded?.city ?? input.city?.trim();
  const country = geocoded?.country ?? input.country?.trim();
  if (!city || !country) {
    throw new HttpError("Location did not resolve to a city and country", 422);
  }
  return {
    city,
    state: geocoded?.state ?? input.state?.trim() ?? null,
    country,
    address: geocoded?.formattedAddress ?? input.location?.trim() ?? null,
    latitude: geocoded?.latitude ?? coordinates.latitude ?? null,
    longitude: geocoded?.longitude ?? coordinates.longitude ?? null,
    source: geocoded ? "google-maps" : null,
    sourceId: geocoded?.placeId ?? null,
  };
}

function destinationData(
  normalized: ReturnType<typeof normalizeResolvedDestination>,
  canonicalKey: string,
) {
  return { ...normalized, canonicalKey };
}

