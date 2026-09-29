import { NextResponse } from "next/server";
import { ItineraryStatus } from "@prisma/client";
import { db } from "@/server/db";
import { errorResponse } from "@/server/http";
import {
  editItinerarySchema,
  itineraryCandidateSchema,
} from "@/server/itinerary/schemas";

type Context = { params: Promise<{ id: string }> };

const includeItinerary = {
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: { stops: { orderBy: { stopOrder: "asc" as const } } },
  },
};

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const itinerary = await db.itinerary.findUnique({
      where: { id },
      include: includeItinerary,
    });
    if (!itinerary)
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 },
      );
    return NextResponse.json({ itinerary });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const input = editItinerarySchema.parse(await request.json());
    const itinerary = await db.itinerary.findUnique({
      where: { id },
      include: includeItinerary,
    });
    if (!itinerary)
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 },
      );
    const candidatePool = itineraryCandidateSchema
      .array()
      .parse(itinerary.candidatePool);

    if (input.action === "remove") {
      const stop = itinerary.days
        .flatMap((day) => day.stops)
        .find((item) => item.id === input.stopId);
      if (!stop)
        return NextResponse.json({ error: "Stop not found" }, { status: 404 });
      await db.$transaction(async (transaction) => {
        await transaction.itineraryStop.delete({ where: { id: stop.id } });
        const remaining = await transaction.itineraryStop.findMany({
          where: { dayId: stop.dayId },
          orderBy: { stopOrder: "asc" },
        });
        await transaction.itineraryStop.updateMany({
          where: { dayId: stop.dayId },
          data: { stopOrder: { increment: 1000 } },
        });
        for (const [index, remainingStop] of remaining.entries()) {
          await transaction.itineraryStop.update({
            where: { id: remainingStop.id },
            data: { stopOrder: index + 1 },
          });
        }
        await transaction.itinerary.update({
          where: { id },
          data: {
            status: ItineraryStatus.PARTIAL,
            candidatePool: candidatePool.filter(
              (candidate) => candidate.id !== stop.candidateId,
            ),
          },
        });
      });
    }

    if (input.action === "reorder") {
      const day = itinerary.days.find(
        (item) => item.dayNumber === input.dayNumber,
      );
      if (!day)
        return NextResponse.json(
          { error: "Itinerary day not found" },
          { status: 404 },
        );
      const existingIds = day.stops.map((stop) => stop.id);
      if (
        existingIds.length !== input.orderedStopIds.length ||
        existingIds.some((stopId) => !input.orderedStopIds.includes(stopId))
      ) {
        return NextResponse.json(
          {
            error:
              "orderedStopIds must contain exactly the stops from the selected day",
          },
          { status: 400 },
        );
      }
      await db.$transaction(async (transaction) => {
        await transaction.itineraryStop.updateMany({
          where: { dayId: day.id },
          data: { stopOrder: { increment: 1000 } },
        });
        for (const [index, stopId] of input.orderedStopIds.entries()) {
          await transaction.itineraryStop.update({
            where: { id: stopId },
            data: { stopOrder: index + 1 },
          });
        }
        await transaction.itinerary.update({
          where: { id },
          data: { status: ItineraryStatus.PARTIAL },
        });
      });
    }

    if (input.action === "add") {
      const day = itinerary.days.find(
        (item) => item.dayNumber === input.dayNumber,
      );
      if (!day)
        return NextResponse.json(
          { error: "Itinerary day not found" },
          { status: 404 },
        );
      const order = day.stops.length + 1;
      await db.$transaction([
        db.itineraryStop.create({
          data: {
            dayId: day.id,
            candidateId: input.candidate.id,
            name: input.candidate.name,
            stopOrder: order,
            startMinute: 0,
            endMinute: input.candidate.estimatedVisitMinutes,
            durationMinutes: input.candidate.estimatedVisitMinutes,
            travelFromPreviousSeconds: 0,
            travelFromPreviousMeters: 0,
            estimatedCostMinor: input.candidate.estimatedCostMinor,
            latitude: input.candidate.location.latitude,
            longitude: input.candidate.location.longitude,
            candidateData: input.candidate,
          },
        }),
        db.itinerary.update({
          where: { id },
          data: {
            status: ItineraryStatus.PARTIAL,
            candidatePool: [
              ...candidatePool.filter(
                (candidate) => candidate.id !== input.candidate.id,
              ),
              input.candidate,
            ],
          },
        }),
      ]);
    }

    if (input.action === "replace") {
      const stop = itinerary.days
        .flatMap((day) => day.stops)
        .find((item) => item.id === input.stopId);
      if (!stop)
        return NextResponse.json({ error: "Stop not found" }, { status: 404 });
      await db.$transaction([
        db.itineraryStop.update({
          where: { id: stop.id },
          data: {
            candidateId: input.candidate.id,
            name: input.candidate.name,
            durationMinutes: input.candidate.estimatedVisitMinutes,
            endMinute: stop.startMinute + input.candidate.estimatedVisitMinutes,
            estimatedCostMinor: input.candidate.estimatedCostMinor,
            latitude: input.candidate.location.latitude,
            longitude: input.candidate.location.longitude,
            candidateData: input.candidate,
          },
        }),
        db.itinerary.update({
          where: { id },
          data: {
            status: ItineraryStatus.PARTIAL,
            candidatePool: [
              ...candidatePool.filter(
                (candidate) =>
                  candidate.id !== stop.candidateId &&
                  candidate.id !== input.candidate.id,
              ),
              input.candidate,
            ],
          },
        }),
      ]);
    }

    const updated = await db.itinerary.findUnique({
      where: { id },
      include: includeItinerary,
    });
    return NextResponse.json({ itinerary: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

