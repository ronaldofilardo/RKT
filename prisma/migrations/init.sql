-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR');

-- CreateEnum
CREATE TYPE "MatchState" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('BEST_OF_3', 'BEST_OF_3_MATCH_TB', 'BEST_OF_5', 'SHORT_SET_2V2_NO_AD', 'MATCH_TB_10', 'PRO_SET_8');

-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('ACE', 'WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR', 'DOUBLE_FAULT');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATHLETE',
    "clubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "clubId" TEXT,
    "sportType" TEXT NOT NULL DEFAULT 'TENNIS',
    "courtType" TEXT,
    "format" "MatchFormat" NOT NULL,
    "state" "MatchState" NOT NULL DEFAULT 'SCHEDULED',
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "scoreState" JSONB,
    "initialServerId" TEXT NOT NULL,
    "nickname" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isResuming" BOOLEAN NOT NULL DEFAULT false,
    "openForAnnotation" BOOLEAN NOT NULL DEFAULT false,
    "tournamentName" TEXT,
    "round" TEXT,
    "bracketType" TEXT,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointLog" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "type" "PointType" NOT NULL,
    "serverId" TEXT NOT NULL,
    "annotations" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Player_clubId_idx" ON "Player"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_clubId_key" ON "Player"("email", "clubId");

-- CreateIndex
CREATE INDEX "Match_clubId_idx" ON "Match"("clubId");

-- CreateIndex
CREATE INDEX "Match_state_idx" ON "Match"("state");

-- CreateIndex
CREATE INDEX "PointLog_matchId_idx" ON "PointLog"("matchId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

