-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "infants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ItineraryStop" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDestination" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "arrivalDate" TIMESTAMP(3),
    "departureDate" TIMESTAMP(3),
    "source" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "name" TEXT NOT NULL,
    "placeType" TEXT NOT NULL DEFAULT 'ATTRACTION',
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "categories" TEXT[],
    "openingHours" JSONB,
    "photos" JSONB,
    "estimatedVisitMinutes" INTEGER,
    "admissionPriceMinor" INTEGER,
    "currency" TEXT,
    "familySuitable" BOOLEAN,
    "source" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "starRating" INTEGER,
    "pricePerNightMinor" INTEGER,
    "estimatedTotalMinor" INTEGER,
    "currency" TEXT,
    "availabilityStatus" TEXT,
    "amenities" TEXT[],
    "bookingUrl" TEXT,
    "source" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "cuisine" TEXT[],
    "priceLevel" INTEGER,
    "openingHours" JSONB,
    "dietaryOptions" TEXT[],
    "familySuitable" BOOLEAN,
    "bookingUrl" TEXT,
    "source" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherSnapshot" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "destinationId" TEXT,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "weatherCode" INTEGER,
    "temperatureMinC" DOUBLE PRECISION,
    "temperatureMaxC" DOUBLE PRECISION,
    "precipitationProbability" INTEGER,
    "source" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPreference" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "userId" TEXT,
    "interests" TEXT[],
    "cuisines" TEXT[],
    "pace" TEXT,
    "hotelStarRating" INTEGER,
    "transportMode" "TransportMode",
    "constraints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "destinationId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "estimated" BOOLEAN NOT NULL DEFAULT true,
    "occurredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TripDestination_tripId_idx" ON "TripDestination"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripDestination_tripId_sequence_key" ON "TripDestination"("tripId", "sequence");

-- CreateIndex
CREATE INDEX "Place_destinationId_idx" ON "Place"("destinationId");

-- CreateIndex
CREATE INDEX "Place_placeType_idx" ON "Place"("placeType");

-- CreateIndex
CREATE INDEX "Hotel_destinationId_idx" ON "Hotel"("destinationId");

-- CreateIndex
CREATE INDEX "Hotel_starRating_idx" ON "Hotel"("starRating");

-- CreateIndex
CREATE INDEX "Restaurant_destinationId_idx" ON "Restaurant"("destinationId");

-- CreateIndex
CREATE INDEX "Restaurant_priceLevel_idx" ON "Restaurant"("priceLevel");

-- CreateIndex
CREATE INDEX "WeatherSnapshot_tripId_forecastDate_idx" ON "WeatherSnapshot"("tripId", "forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherSnapshot_destinationId_forecastDate_key" ON "WeatherSnapshot"("destinationId", "forecastDate");

-- CreateIndex
CREATE INDEX "TripPreference_tripId_idx" ON "TripPreference"("tripId");

-- CreateIndex
CREATE INDEX "TripPreference_userId_idx" ON "TripPreference"("userId");

-- CreateIndex
CREATE INDEX "Expense_tripId_occurredAt_idx" ON "Expense"("tripId", "occurredAt");

-- CreateIndex
CREATE INDEX "Expense_destinationId_idx" ON "Expense"("destinationId");

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDestination" ADD CONSTRAINT "TripDestination_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TripDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TripDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TripDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherSnapshot" ADD CONSTRAINT "WeatherSnapshot_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherSnapshot" ADD CONSTRAINT "WeatherSnapshot_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TripDestination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPreference" ADD CONSTRAINT "TripPreference_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPreference" ADD CONSTRAINT "TripPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TripDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;



