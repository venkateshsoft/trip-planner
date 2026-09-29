ALTER TABLE "TripDestination" ADD COLUMN "canonicalKey" TEXT;

UPDATE "TripDestination"
SET "canonicalKey" = lower(trim("city") || '|' || trim(coalesce("state", '')) || '|' || trim("country"));

ALTER TABLE "TripDestination" ALTER COLUMN "canonicalKey" SET NOT NULL;
CREATE UNIQUE INDEX "TripDestination_tripId_canonicalKey_key" ON "TripDestination"("tripId", "canonicalKey");

