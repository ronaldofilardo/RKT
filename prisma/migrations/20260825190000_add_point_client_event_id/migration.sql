ALTER TABLE "PointLog" ADD COLUMN "clientEventId" TEXT;
CREATE UNIQUE INDEX "PointLog_matchId_clientEventId_key" ON "PointLog"("matchId", "clientEventId");
