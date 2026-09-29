import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { GoogleMapsProvider } from "@/server/providers/google-maps";
import { providerRouteSchema } from "@/server/providers/schemas";

export async function POST(request: Request) {
  try {
    const input = providerRouteSchema.parse(await request.json());
    const route = await new GoogleMapsProvider().route(
      input.origin,
      input.destination,
      input.mode,
    );
    return NextResponse.json({ route });
  } catch (error) {
    return errorResponse(error);
  }
}

