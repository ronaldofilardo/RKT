ALTER TABLE "PointLog" ADD COLUMN "sequenceNumber" INTEGER;

WITH ordered_points AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "matchId" ORDER BY "timestamp" ASC, "id" ASC) AS sequence_number
  FROM "PointLog"
)
UPDATE "PointLog" AS point_log
SET "sequenceNumber" = ordered_points.sequence_number
FROM ordered_points
WHERE point_log."id" = ordered_points."id";

CREATE UNIQUE INDEX "PointLog_matchId_sequenceNumber_key"
  ON "PointLog"("matchId", "sequenceNumber")
  WHERE "sequenceNumber" IS NOT NULL;

CREATE INDEX "PointLog_matchId_sequenceNumber_idx"
  ON "PointLog"("matchId", "sequenceNumber");

ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_sequenceNumber_positive_check" CHECK ("sequenceNumber" IS NULL OR "sequenceNumber" > 0);

