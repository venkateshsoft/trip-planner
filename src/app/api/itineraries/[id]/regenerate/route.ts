import { NextResponse } from "next/server";
import { ItineraryStatus } from "@prisma/client";
import { db } from "@/server/db";
import { errorResponse } from "@/server/http";
import {
  generateItinerary,
  buildTravelMatrix,
} from "@/server/itinerary/engine";
import { itineraryCandidateSchema } from "@/server/itinerary/schemas";
import { GoogleMapsProvider } from "@/server/providers/google-maps";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const itinerary = await db.itinerary.findUnique({
      where: { id },
      include: { trip: true },
    });
    if (!itinerary)
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 },
      );
    const candidates = itineraryCandidateSchema
      .array()
      .parse(itinerary.candidatePool);
    const trip = itinerary.trip;
    const planningTrip = {
      id: trip.id,
      startDate: trip.startDate,
      travelDays: trip.travelDays,
      startingLocation: trip.startingLocation,
      transportMode: trip.transportMode,
      totalBudgetMinor: trip.totalBudgetMinor,
      hotelBudgetMinor: trip.hotelBudgetMinor,
      foodBudgetMinor: trip.foodBudgetMinor,
      interests: trip.interests,
    };
    const matrix = await buildTravelMatrix(
      planningTrip,
      candidates,
      new GoogleMapsProvider(),
    );
    const generated = await generateItinerary(planningTrip, candidates, matrix);
    const status = generated.days.some((day) => day.stops.length === 0)
      ? ItineraryStatus.PARTIAL
      : ItineraryStatus.COMPLETED;
    const updated = await db.$transaction(async (transaction) => {
      await transaction.itineraryDay.deleteMany({ where: { itineraryId: id } });
      return transaction.itinerary.update({
        where: { id },
        data: {
          status,
          candidatePool: candidates,
          totalEstimatedCostMinor: generated.totalEstimatedCostMinor,
          budgetRemainingMinor: generated.budgetRemainingMinor,
          generatedAt: new Date(),
          days: {
            create: generated.days.map((day) => ({
              dayNumber: day.dayNumber,
              date: day.date,
              totalTravelSeconds: day.totalTravelSeconds,
              estimatedCostMinor: day.estimatedCostMinor,
              stops: {
                create: day.stops.map((stop, index) => ({
                  candidateId: stop.id,
                  name: stop.name,
                  stopOrder: index + 1,
                  startMinute: stop.startMinute,
                  endMinute: stop.endMinute,
                  durationMinutes: stop.estimatedVisitMinutes,
                  travelFromPreviousSeconds:
                    stop.travelFromPrevious.durationSeconds,
                  travelFromPreviousMeters:
                    stop.travelFromPrevious.distanceMeters,
                  estimatedCostMinor: stop.estimatedCostMinor,
                  latitude: stop.location.latitude,
                  longitude: stop.location.longitude,
                  candidateData: stop,
                })),
              },
            })),
          },
        },
        include: {
          days: { include: { stops: { orderBy: { stopOrder: "asc" } } } },
        },
      });
    });
    return NextResponse.json({ itinerary: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

