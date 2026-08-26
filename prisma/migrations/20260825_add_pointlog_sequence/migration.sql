-- Preserve deterministic point ordering for report/scout reconstruction.
ALTER TABLE "PointLog" ADD COLUMN "sequenceNumber" INTEGER;

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "matchId" ORDER BY "timestamp" ASC, "id" ASC) AS seq
  FROM "PointLog"
)
UPDATE "PointLog" AS p
SET "sequenceNumber" = numbered.seq
FROM numbered
WHERE p."id" = numbered."id";

CREATE UNIQUE INDEX "PointLog_matchId_sequenceNumber_key"
  ON "PointLog"("matchId", "sequenceNumber");

CREATE INDEX "PointLog_matchId_sequenceNumber_idx"
  ON "PointLog"("matchId", "sequenceNumber");
