import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { AIPlanningService } from "@/server/ai/service";
import { aiPreferenceRequestSchema } from "@/server/ai/schemas";

export async function POST(request: Request) {
  try {
    const { text } = aiPreferenceRequestSchema.parse(await request.json());
    const preferences = await new AIPlanningService().extractPreferences(text);
    return NextResponse.json({ preferences });
  } catch (error) {
    return errorResponse(error);
  }
}

