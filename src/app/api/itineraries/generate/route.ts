import { NextResponse } from "next/server";
import { ItineraryStatus } from "@prisma/client";
import { db } from "@/server/db";
import { errorResponse } from "@/server/http";
import { GoogleMapsProvider } from "@/server/providers/google-maps";
import {
  generateItinerary,
  buildTravelMatrix,
} from "@/server/itinerary/engine";
import { generateItinerarySchema } from "@/server/itinerary/schemas";

export async function POST(request: Request) {
  try {
    const input = generateItinerarySchema.parse(await request.json());
    const trip = await db.trip.findUnique({ where: { id: input.tripId } });
    if (!trip)
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });

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
    const routes = new GoogleMapsProvider();
    const matrix = await buildTravelMatrix(
      planningTrip,
      input.candidates,
      routes,
    );
    const generated = await generateItinerary(
      planningTrip,
      input.candidates,
      matrix,
    );
    const itinerary = await db.itinerary.create({
      data: {
        tripId: trip.id,
        status: generated.days.some((day) => day.stops.length === 0)
          ? ItineraryStatus.PARTIAL
          : ItineraryStatus.COMPLETED,
        totalEstimatedCostMinor: generated.totalEstimatedCostMinor,
        budgetRemainingMinor: generated.budgetRemainingMinor,
        candidatePool: input.candidates,
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
    return NextResponse.json({ itinerary }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

