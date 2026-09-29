import { notFound } from "next/navigation";
import { db } from "@/server/db";
import TripWorkspace from "@/components/trips/trip-workspace";

export const dynamic = "force-dynamic";

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      destinations: { orderBy: { sequence: "asc" }, include: { places: { orderBy: [{ rating: "desc" }, { name: "asc" }] } } },
      itineraries: { orderBy: { generatedAt: "desc" }, take: 1, select: { id: true } },
    },
  });
  if (!trip) notFound();

  return <TripWorkspace trip={trip} />; /*
    <main>
      <h1>
        {trip.city}, {trip.country}
      </h1>
      <p>
        {trip.travelDays} days Â· {trip.travelerCount} traveler(s) Â·{" "}
        {trip.transportMode.toLowerCase()}
      </p>
      <p>
        {trip.startDate.toISOString().slice(0, 10)} to{" "}
        {trip.endDate.toISOString().slice(0, 10)}
      </p>
      <p>
        Budget: {trip.totalBudgetMinor} {trip.currency} minor units
      </p>
      <p>Interests: {trip.interests.join(", ") || "None specified"}</p>
      <p>
        <a href={`/trips/${trip.id}/edit`}>Edit trip</a>
      </p>
      <p>
        <a href={`/trips/${trip.id}/itinerary`}>Open itinerary editor</a>
      </p>
      <p>
        Trip saved. Discovery and itinerary generation will be added in later
        phases.
      </p>
    </main>
  */
}

