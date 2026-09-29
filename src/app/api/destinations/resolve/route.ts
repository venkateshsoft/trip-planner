import { NextResponse } from "next/server";
import { DestinationResolver } from "@/server/destinations";
import { errorResponse } from "@/server/http";
import { destinationResolveSchema } from "@/server/providers/schemas";

export async function POST(request: Request) {
  try {
    const input = destinationResolveSchema.parse(await request.json());
    const result = await new DestinationResolver().resolve(input);
    return NextResponse.json({ ...result, normalizedLocation: result.destination });
  } catch (error) {
    return errorResponse(error);
  }
}

