CREATE TYPE "CoachAthleteLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'ENDED');
CREATE TYPE "SupportAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Match" ADD COLUMN "tournamentId" TEXT;

CREATE TABLE "coach_athlete_links" (
    "id" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "CoachAthleteLinkStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    CONSTRAINT "coach_athlete_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_access_requests" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SupportAccessStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    CONSTRAINT "support_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "ctId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tournaments_ctId_name_key" ON "tournaments"("ctId", "name");
CREATE INDEX "tournaments_ctId_status_idx" ON "tournaments"("ctId", "status");
CREATE UNIQUE INDEX "coach_athlete_links_coachUserId_playerId_key" ON "coach_athlete_links"("coachUserId", "playerId");
CREATE INDEX "coach_athlete_links_playerId_status_idx" ON "coach_athlete_links"("playerId", "status");
CREATE INDEX "support_access_requests_requesterUserId_status_createdAt_idx" ON "support_access_requests"("requesterUserId", "status", "createdAt");
CREATE INDEX "support_access_requests_status_createdAt_idx" ON "support_access_requests"("status", "createdAt");
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_ctId_fkey"
  FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coach_athlete_links" ADD CONSTRAINT "coach_athlete_links_coachUserId_fkey"
  FOREIGN KEY ("coachUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coach_athlete_links" ADD CONSTRAINT "coach_athlete_links_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_access_requests" ADD CONSTRAINT "support_access_requests_requesterUserId_fkey"
  FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_access_requests" ADD CONSTRAINT "support_access_requests_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_access_requests" ADD CONSTRAINT "support_access_requests_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
