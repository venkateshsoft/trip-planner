import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { GoogleMapsProvider } from "@/server/providers/google-maps";
import { providerPlacesSchema } from "@/server/providers/schemas";
import { persistDiscoveredPlaces } from "@/server/providers/place-persistence";

export async function POST(request: Request) {
  try {
    const input = providerPlacesSchema.parse(await request.json());
    const places = await new GoogleMapsProvider().searchPlaces(
      input.query,
      input.location,
      input.includedType,
    );
    if (!input.destinationId) return NextResponse.json({ places });

    const persistedPlaces = await persistDiscoveredPlaces(
      input.destinationId,
      places,
    );
    return NextResponse.json({ places: persistedPlaces, persisted: true });
  } catch (error) {
    return errorResponse(error);
  }
}

