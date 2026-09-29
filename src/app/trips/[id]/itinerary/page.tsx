import { notFound } from "next/navigation";
import ItineraryEditor from "@/components/itinerary/itinerary-editor";
import { db } from "@/server/db";

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itinerary = await db.itinerary.findFirst({
    where: { tripId: id },
    orderBy: { generatedAt: "desc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { stops: { orderBy: { stopOrder: "asc" } } },
      },
    },
  });
  if (!itinerary) notFound();
  return <ItineraryEditor initialItinerary={itinerary} />;
}

