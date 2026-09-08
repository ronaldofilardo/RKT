-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN "voidedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PointLog_matchId_voidedAt_idx" ON "PointLog"("matchId", "voidedAt");
