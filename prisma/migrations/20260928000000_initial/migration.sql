-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('WALKING', 'BICYCLING', 'TRANSIT', 'DRIVING');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('COMPLETED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "googleMapsUrl" TEXT,
    "mapLatitude" DOUBLE PRECISION,
    "mapLongitude" DOUBLE PRECISION,
    "startingLocation" TEXT NOT NULL,
    "transportMode" "TransportMode" NOT NULL,
    "travelDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalBudgetMinor" INTEGER NOT NULL,
    "hotelBudgetMinor" INTEGER NOT NULL,
    "foodBudgetMinor" INTEGER NOT NULL,
    "travelerCount" INTEGER NOT NULL DEFAULT 1,
    "hotelStarRating" INTEGER,
    "interests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "status" "ItineraryStatus" NOT NULL DEFAULT 'COMPLETED',
    "totalEstimatedCostMinor" INTEGER NOT NULL,
    "budgetRemainingMinor" INTEGER NOT NULL,
    "candidatePool" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalTravelSeconds" INTEGER NOT NULL,
    "estimatedCostMinor" INTEGER NOT NULL,
    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItineraryStop" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "travelFromPreviousSeconds" INTEGER NOT NULL,
    "travelFromPreviousMeters" INTEGER NOT NULL,
    "estimatedCostMinor" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "candidateData" JSONB NOT NULL,
    CONSTRAINT "ItineraryStop_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderCacheEntry" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderCacheEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Trip_startDate_endDate_idx" ON "Trip"("startDate", "endDate");
CREATE INDEX "Itinerary_tripId_generatedAt_idx" ON "Itinerary"("tripId", "generatedAt");
CREATE UNIQUE INDEX "ItineraryDay_itineraryId_dayNumber_key" ON "ItineraryDay"("itineraryId", "dayNumber");
CREATE UNIQUE INDEX "ItineraryStop_dayId_stopOrder_key" ON "ItineraryStop"("dayId", "stopOrder");
CREATE INDEX "ProviderCacheEntry_expiresAt_idx" ON "ProviderCacheEntry"("expiresAt");
CREATE UNIQUE INDEX "ProviderCacheEntry_provider_cacheKey_key" ON "ProviderCacheEntry"("provider", "cacheKey");

ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ItineraryDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

