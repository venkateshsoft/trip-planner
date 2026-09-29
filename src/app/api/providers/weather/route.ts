import { NextResponse } from "next/server";
import { errorResponse } from "@/server/http";
import { providerWeatherSchema } from "@/server/providers/schemas";
import { WeatherProvider } from "@/server/providers/weather";

export async function POST(request: Request) {
  try {
    const input = providerWeatherSchema.parse(await request.json());
    const forecast = await new WeatherProvider().forecast(
      input.location,
      input.startDate,
      input.endDate,
    );
    return NextResponse.json({ forecast });
  } catch (error) {
    return errorResponse(error);
  }
}

