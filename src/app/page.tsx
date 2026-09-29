import Link from "next/link";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let trips = [] as Awaited<ReturnType<typeof db.trip.findMany>>;
  let databaseError = false;
  try {
    trips = await db.trip.findMany({ orderBy: { updatedAt: "desc" }, take: 20 });
  } catch {
    databaseError = true;
  }
  return (
    <main className="shell">
      <header className="hero"><div><p className="eyebrow">TRIP PLANNER</p><h1>Turn a destination into a day-by-day plan.</h1><p className="lede">Save a trip, discover places around it, and generate a practical itinerary you can adjust.</p></div><Link className="button primary" href="/trips/new">Plan a new trip</Link></header>
      {databaseError && <div className="notice" role="alert">The database is not reachable yet. Configure DATABASE_URL and DIRECT_URL, then check <Link href="/api/ready">readiness</Link>.</div>}
      <section className="section-heading"><div><p className="eyebrow">YOUR TRIPS</p><h2>Continue planning</h2></div><span className="muted">{trips.length} saved</span></section>
      {trips.length === 0 ? <div className="empty-card"><h2>Your next trip starts here.</h2><p>Start with a city, dates, budget, and a few interests.</p><Link className="button secondary" href="/trips/new">Create your first trip</Link></div> : <div className="card-grid">{trips.map((trip) => <Link className="trip-card" href={`/trips/${trip.id}`} key={trip.id}><p className="eyebrow">{trip.transportMode.toLowerCase()}</p><h3>{trip.city}, {trip.country}</h3><p className="muted">{trip.travelDays} days Â· {trip.startDate.toISOString().slice(0, 10)}</p><span className="card-arrow">Open trip â†’</span></Link>)}</div>}
    </main>
  );
}

