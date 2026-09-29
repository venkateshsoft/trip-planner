import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { AIPlanningService } from "@/server/ai/service";
import { aiExplanationRequestSchema } from "@/server/ai/schemas";

export async function POST(request: Request) {
  try {
    const input = aiExplanationRequestSchema.parse(await request.json());
    const explanations = await new AIPlanningService().explainRecommendations(
      input,
    );
    return NextResponse.json(explanations);
  } catch (error) {
    return errorResponse(error);
  }
}

