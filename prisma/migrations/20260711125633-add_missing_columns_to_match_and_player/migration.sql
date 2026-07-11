-- Create a new migration
ALTER TABLE "Match" ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "finishNote" TEXT,
ADD COLUMN "finishReason" "MatchFinishReason",
ADD COLUMN "winnerId" TEXT;

ALTER TABLE "Player" ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "rankings" JSONB;

CREATE INDEX "Match_deletedAt_idx" ON "Match"("deletedAt");