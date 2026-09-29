import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { GoogleMapsProvider } from "@/server/providers/google-maps";
import { providerGeocodeSchema } from "@/server/providers/schemas";

export async function POST(request: Request) {
  try {
    const { address } = providerGeocodeSchema.parse(await request.json());
    const location = await new GoogleMapsProvider().geocode(address);
    return NextResponse.json({ location });
  } catch (error) {
    return errorResponse(error);
  }
}

