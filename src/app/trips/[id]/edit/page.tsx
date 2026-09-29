import { notFound } from "next/navigation";
import TripForm from "@/components/trips/trip-form";
import { db } from "@/server/db";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) notFound();

  return (
    <TripForm
      tripId={trip.id}
      initialValues={{
        city: trip.city,
        state: trip.state ?? "",
        country: trip.country,
        googleMapsUrl: trip.googleMapsUrl ?? "",
        startingLocation: trip.startingLocation,
        transportMode: trip.transportMode,
        travelDays: trip.travelDays,
        startDate: trip.startDate.toISOString().slice(0, 10),
        endDate: trip.endDate.toISOString().slice(0, 10),
        currency: trip.currency,
        totalBudgetMinor: trip.totalBudgetMinor,
        hotelBudgetMinor: trip.hotelBudgetMinor,
        foodBudgetMinor: trip.foodBudgetMinor,
        travelerCount: trip.travelerCount,
        hotelStarRating: trip.hotelStarRating ?? 3,
        interests: trip.interests.join(", "),
      }}
    />
  );
}

