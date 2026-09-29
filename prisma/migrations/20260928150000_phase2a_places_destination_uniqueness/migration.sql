-- CreateIndex
CREATE UNIQUE INDEX "Place_destinationId_source_sourceId_key"
ON "Place"("destinationId", "source", "sourceId");

