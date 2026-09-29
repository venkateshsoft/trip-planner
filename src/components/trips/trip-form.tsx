"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/components/auth/client-fetch";

const initialState = {
  city: "",
  state: "",
  country: "",
  googleMapsUrl: "",
  startingLocation: "",
  transportMode: "DRIVING",
  travelDays: 1,
  startDate: "",
  endDate: "",
  currency: "USD",
  totalBudgetMinor: 0,
  hotelBudgetMinor: 0,
  foodBudgetMinor: 0,
  travelerCount: 1,
  hotelStarRating: 3,
  interests: "",
};

type TripFormState = typeof initialState;

export default function TripForm({
  initialValues,
  tripId,
}: {
  initialValues?: Partial<TripFormState>;
  tripId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TripFormState>({
    ...initialState,
    ...initialValues,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(name: string, value: string | number) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      travelDays: Number(form.travelDays),
      totalBudgetMinor: Number(form.totalBudgetMinor),
      hotelBudgetMinor: Number(form.hotelBudgetMinor),
      foodBudgetMinor: Number(form.foodBudgetMinor),
      travelerCount: Number(form.travelerCount),
      hotelStarRating: Number(form.hotelStarRating),
      interests: form.interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      const response = await fetchWithSession(
        tripId ? `/api/trips/${tripId}` : "/api/trips",
        {
          method: tripId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session is missing. Redirecting to sign in...");
          return;
        }
        setError(result.error ?? "Could not save trip. Check service readiness.");
        return;
      }
      router.push(`/trips/${result.trip.id}`);
    } catch {
      setError("Could not reach the trip service. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>{tripId ? "Edit trip" : "Create a trip"}</h1>
      <p>Enter your trip details, then discover places and build an itinerary from the trip workspace.</p>
      <form onSubmit={submit}>
        <fieldset>
          <legend>Destination</legend>
          <label>
            City{" "}
            <input
              required
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </label>
          <label>
            State / region{" "}
            <input
              value={form.state}
              onChange={(event) => update("state", event.target.value)}
            />
          </label>
          <label>
            Country{" "}
            <input
              required
              value={form.country}
              onChange={(event) => update("country", event.target.value)}
            />
          </label>
          <label>
            Google Maps link{" "}
            <input
              type="url"
              value={form.googleMapsUrl}
              onChange={(event) => update("googleMapsUrl", event.target.value)}
            />
          </label>
          <label>
            Starting location{" "}
            <input
              required
              value={form.startingLocation}
              onChange={(event) =>
                update("startingLocation", event.target.value)
              }
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Schedule and travel</legend>
          <label>
            Start date{" "}
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </label>
          <label>
            End date{" "}
            <input
              required
              type="date"
              value={form.endDate}
              onChange={(event) => update("endDate", event.target.value)}
            />
          </label>
          <label>
            Travel days{" "}
            <input
              required
              min="1"
              max="90"
              type="number"
              value={form.travelDays}
              onChange={(event) => update("travelDays", event.target.value)}
            />
          </label>
          <label>
            Transport{" "}
            <select
              value={form.transportMode}
              onChange={(event) => update("transportMode", event.target.value)}
            >
              <option value="DRIVING">Driving</option>
              <option value="TRANSIT">Public transit</option>
              <option value="WALKING">Walking</option>
              <option value="BICYCLING">Bicycling</option>
            </select>
          </label>
          <label>
            Travelers{" "}
            <input
              required
              min="1"
              type="number"
              value={form.travelerCount}
              onChange={(event) => update("travelerCount", event.target.value)}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Budget and preferences</legend>
          <p>
            Budgets are entered in the smallest currency unit, for example cents
            for USD.
          </p>
          <label>
            Currency{" "}
            <input
              required
              maxLength={3}
              value={form.currency}
              onChange={(event) =>
                update("currency", event.target.value.toUpperCase())
              }
            />
          </label>
          <label>
            Total budget (minor units){" "}
            <input
              min="0"
              type="number"
              value={form.totalBudgetMinor}
              onChange={(event) =>
                update("totalBudgetMinor", event.target.value)
              }
            />
          </label>
          <label>
            Hotel budget (minor units){" "}
            <input
              min="0"
              type="number"
              value={form.hotelBudgetMinor}
              onChange={(event) =>
                update("hotelBudgetMinor", event.target.value)
              }
            />
          </label>
          <label>
            Food budget (minor units){" "}
            <input
              min="0"
              type="number"
              value={form.foodBudgetMinor}
              onChange={(event) =>
                update("foodBudgetMinor", event.target.value)
              }
            />
          </label>
          <label>
            Preferred hotel stars{" "}
            <input
              min="1"
              max="5"
              type="number"
              value={form.hotelStarRating}
              onChange={(event) =>
                update("hotelStarRating", event.target.value)
              }
            />
          </label>
          <label>
            Interests / preferences{" "}
            <input
              placeholder="history, food, museums"
              value={form.interests}
              onChange={(event) => update("interests", event.target.value)}
            />
          </label>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <button disabled={saving} type="submit">
          {saving ? "Savingâ€¦" : tripId ? "Save changes" : "Create trip"}
        </button>
      </form>
    </main>
  );
}

