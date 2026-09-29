"use client";

import { useState } from "react";
import { fetchWithSession } from "@/components/auth/client-fetch";

type Stop = {
  id: string;
  candidateId: string;
  name: string;
  stopOrder: number;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  estimatedCostMinor: number;
  latitude: number;
  longitude: number;
};

type Day = {
  id: string;
  dayNumber: number;
  date: string | Date;
  stops: Stop[];
};
type Itinerary = {
  id: string;
  status: string;
  totalEstimatedCostMinor: number;
  budgetRemainingMinor: number;
  days: Day[];
};

function timeLabel(minutes: number) {
  if (!minutes) return "Unscheduled";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export default function ItineraryEditor({
  initialItinerary,
}: {
  initialItinerary: Itinerary;
}) {
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [draggedStopId, setDraggedStopId] = useState<string>();
  const [selectedStopId, setSelectedStopId] = useState<string>();
  const [message, setMessage] = useState("");
  const [candidate, setCandidate] = useState({
    name: "",
    latitude: "",
    longitude: "",
    estimatedVisitMinutes: "90",
    estimatedCostMinor: "0",
  });

  async function mutate(
    body: unknown,
    endpoint = `/api/itineraries/${itinerary.id}`,
  ) {
    setMessage("");
    const response = await fetchWithSession(endpoint, {
      method: endpoint.includes("regenerate") ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status !== 401) setMessage(result.error ?? "Could not update itinerary");
      return false;
    }
    setItinerary(result.itinerary);
    setMessage("Saved. Regenerate to recalculate routes and times.");
    return true;
  }

  function candidatePayload() {
    return {
      id: `manual-${Date.now()}`,
      name: candidate.name,
      location: {
        latitude: Number(candidate.latitude),
        longitude: Number(candidate.longitude),
      },
      interestTags: [],
      estimatedVisitMinutes: Number(candidate.estimatedVisitMinutes),
      estimatedCostMinor: Number(candidate.estimatedCostMinor),
    };
  }

  return (
    <main>
      <h1>Itinerary editor</h1>
      <p>
        Status: {itinerary.status.toLowerCase()} Â· Estimated cost:{" "}
        {itinerary.totalEstimatedCostMinor} Â· Remaining budget:{" "}
        {itinerary.budgetRemainingMinor}
      </p>
      {message && <p role="status">{message}</p>}
      <button
        onClick={() =>
          mutate({}, `/api/itineraries/${itinerary.id}/regenerate`)
        }
      >
        Regenerate itinerary
      </button>
      {itinerary.days.map((day) => (
        <section key={day.id}>
          <h2>Day {day.dayNumber}</h2>
          <ol>
            {day.stops.map((stop) => (
              <li
                key={stop.id}
                draggable
                onDragStart={() => setDraggedStopId(stop.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!draggedStopId || draggedStopId === stop.id) return;
                  const ids = day.stops.map((item) => item.id);
                  const from = ids.indexOf(draggedStopId);
                  const to = ids.indexOf(stop.id);
                  ids.splice(from, 1);
                  ids.splice(to, 0, draggedStopId);
                  void mutate({
                    action: "reorder",
                    dayNumber: day.dayNumber,
                    orderedStopIds: ids,
                  });
                  setDraggedStopId(undefined);
                }}
              >
                <button onClick={() => setSelectedStopId(stop.id)}>
                  {stop.name}
                </button>{" "}
                â€” {timeLabel(stop.startMinute)}â€“{timeLabel(stop.endMinute)}
                <button
                  onClick={() => mutate({ action: "remove", stopId: stop.id })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <fieldset>
        <legend>{selectedStopId ? "Replace selected stop" : "Add stop"}</legend>
        <label>
          Name{" "}
          <input
            value={candidate.name}
            onChange={(event) =>
              setCandidate({ ...candidate, name: event.target.value })
            }
          />
        </label>
        <label>
          Latitude{" "}
          <input
            type="number"
            value={candidate.latitude}
            onChange={(event) =>
              setCandidate({ ...candidate, latitude: event.target.value })
            }
          />
        </label>
        <label>
          Longitude{" "}
          <input
            type="number"
            value={candidate.longitude}
            onChange={(event) =>
              setCandidate({ ...candidate, longitude: event.target.value })
            }
          />
        </label>
        <label>
          Visit minutes{" "}
          <input
            type="number"
            min="15"
            value={candidate.estimatedVisitMinutes}
            onChange={(event) =>
              setCandidate({
                ...candidate,
                estimatedVisitMinutes: event.target.value,
              })
            }
          />
        </label>
        <label>
          Cost minor units{" "}
          <input
            type="number"
            min="0"
            value={candidate.estimatedCostMinor}
            onChange={(event) =>
              setCandidate({
                ...candidate,
                estimatedCostMinor: event.target.value,
              })
            }
          />
        </label>
        {!selectedStopId && (
          <button
            onClick={() =>
              mutate({
                action: "add",
                dayNumber: 1,
                candidate: candidatePayload(),
              })
            }
          >
            Add to day 1
          </button>
        )}
        {selectedStopId && (
          <button
            onClick={() =>
              mutate({
                action: "replace",
                stopId: selectedStopId,
                candidate: candidatePayload(),
              })
            }
          >
            Replace selected
          </button>
        )}
        {selectedStopId && (
          <button onClick={() => setSelectedStopId(undefined)}>
            Cancel replace
          </button>
        )}
      </fieldset>
    </main>
  );
}

