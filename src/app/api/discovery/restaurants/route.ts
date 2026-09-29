import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { DiscoveryService } from "@/server/discovery/service";
import { restaurantDiscoverySchema } from "@/server/discovery/schemas";

export async function POST(request: Request) {
  try {
    const input = restaurantDiscoverySchema.parse(await request.json());
    const restaurants = await new DiscoveryService().restaurants(input);
    return NextResponse.json({ restaurants });
  } catch (error) {
    return errorResponse(error);
  }
}

