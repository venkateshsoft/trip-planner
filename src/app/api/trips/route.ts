import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { DestinationResolver } from "@/server/destinations";
import { errorResponse } from "@/server/http";
import { extractMapCoordinates, normalizeGoogleMapsUrl } from "@/server/maps";
import { tripInputSchema } from "@/server/validation/trip";

export async function GET() {
  try {
    const trips = await db.trip.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ trips });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = tripInputSchema.parse(await request.json());
    const googleMapsUrl = normalizeGoogleMapsUrl(input.googleMapsUrl);
    const coordinates = extractMapCoordinates(googleMapsUrl);
    const trip = await db.trip.create({
      data: {
        ...input,
        state: input.state || null,
        googleMapsUrl: googleMapsUrl ?? null,
        mapLatitude: coordinates.latitude,
        mapLongitude: coordinates.longitude,
      },
    });
    const destination = await new DestinationResolver({ maps: { geocode: async () => undefined } }).resolve(
      {
        tripId: trip.id,
        city: input.city,
        state: input.state,
        country: input.country,
        googleMapsUrl,
      },
      { geocode: false },
    );
    return NextResponse.json({ trip, destinationId: destination.destinationId }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

