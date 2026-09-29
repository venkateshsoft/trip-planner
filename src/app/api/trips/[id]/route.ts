import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { errorResponse } from "@/server/http";
import { extractMapCoordinates, normalizeGoogleMapsUrl } from "@/server/maps";
import { tripInputSchema } from "@/server/validation/trip";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const trip = await db.trip.findUnique({ where: { id } });
    if (!trip)
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    return NextResponse.json({ trip });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = tripInputSchema.parse(await request.json());
    const googleMapsUrl = normalizeGoogleMapsUrl(input.googleMapsUrl);
    const coordinates = extractMapCoordinates(googleMapsUrl);
    const trip = await db.trip.update({
      where: { id },
      data: {
        ...input,
        state: input.state || null,
        googleMapsUrl: googleMapsUrl ?? null,
        mapLatitude: coordinates.latitude,
        mapLongitude: coordinates.longitude,
      },
    });
    return NextResponse.json({ trip });
  } catch (error) {
    return errorResponse(error);
  }
}

