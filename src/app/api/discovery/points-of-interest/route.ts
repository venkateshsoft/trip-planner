import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { DiscoveryService } from "@/server/discovery/service";
import { poiDiscoverySchema } from "@/server/discovery/schemas";

export async function POST(request: Request) {
  try {
    const input = poiDiscoverySchema.parse(await request.json());
    const pointsOfInterest = await new DiscoveryService().pointsOfInterest(
      input,
    );
    return NextResponse.json({ pointsOfInterest });
  } catch (error) {
    return errorResponse(error);
  }
}

