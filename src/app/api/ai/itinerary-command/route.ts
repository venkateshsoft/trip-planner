import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { AIPlanningService } from "@/server/ai/service";
import { itineraryCommandRequestSchema } from "@/server/ai/schemas";

export async function POST(request: Request) {
  try {
    const input = itineraryCommandRequestSchema.parse(await request.json());
    const command = await new AIPlanningService().interpretItineraryCommand(
      input,
    );
    return NextResponse.json({ command });
  } catch (error) {
    return errorResponse(error);
  }
}

