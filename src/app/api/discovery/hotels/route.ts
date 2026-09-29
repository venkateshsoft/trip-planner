import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { DiscoveryService } from "@/server/discovery/service";
import { hotelDiscoverySchema } from "@/server/discovery/schemas";

export async function POST(request: Request) {
  try {
    const input = hotelDiscoverySchema.parse(await request.json());
    const hotels = await new DiscoveryService().hotels(input);
    return NextResponse.json({ hotels });
  } catch (error) {
    return errorResponse(error);
  }
}

