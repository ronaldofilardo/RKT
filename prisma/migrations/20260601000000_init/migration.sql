-- Baseline migration: recreates the base schema that previously existed in the
-- dev database (created originally via `prisma db push`) BEFORE the first
-- timestamped migration (20260621000000_add_annotation_sessions) was applied.
--
-- Without this migration the shadow database rebuild performed by
-- `prisma migrate dev` fails with P1014 ("The underlying table for model
-- `Match` does not exist") because none of the tracked migrations actually
-- create the `Match` / `Player` / `PointLog` tables.
--
-- The 4 subsequent migrations layer their changes on top of this baseline:
--   * 20260621000000_add_annotation_sessions  -> match_annotation_sessions + annotation_endorsements
--   * 20260711125633-...                       -> Match/Player extra columns
--   * 20260711_remove_best_of_3_no_ad          -> MatchFormat enum trim
--   * 20260813_add_pointlog_audio_note         -> PointLog audio columns

-- CreateEnum
-- NOTE: "AnnotationSessionStatus" is intentionally NOT created here because the
-- subsequent migration 20260621000000_add_annotation_sessions already creates it
-- (and it was originally created on the dev DB by that same migration).
CREATE TYPE "MatchFinishReason" AS ENUM ('COMPLETED', 'ABANDONED', 'WALKOVER', 'INJURY', 'OUTRO');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('BEST_OF_3', 'BEST_OF_3_MATCH_TB', 'BEST_OF_5', 'BEST_OF_3_NO_AD', 'SHORT_SET_2V2_NO_AD', 'MATCH_TB_10', 'PRO_SET_8');

-- CreateEnum
CREATE TYPE "MatchState" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('ACE', 'WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR', 'DOUBLE_FAULT', 'FAULT_SECOND', 'FAULT_FIRST');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATHLETE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "club" TEXT,
    "age" INTEGER,
    "backhand" TEXT,
    "dominance" TEXT,
    "gender" TEXT,
    "ranking" INTEGER,
    "birthDate" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "format" "MatchFormat" NOT NULL,
    "state" "MatchState" NOT NULL DEFAULT 'SCHEDULED',
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "scoreState" JSONB,
    "initialServerId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sportType" TEXT NOT NULL DEFAULT 'TENNIS',
    "courtType" TEXT,
    "nickname" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isResuming" BOOLEAN NOT NULL DEFAULT false,
    "openForAnnotation" BOOLEAN NOT NULL DEFAULT false,
    "tournamentName" TEXT,
    "round" TEXT,
    "bracketType" TEXT,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "PointLog" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "type" "PointType" NOT NULL,
    "serverId" TEXT NOT NULL,
    "annotations" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- PrimaryKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("id");

-- PrimaryKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pkey" PRIMARY KEY ("id");

-- PrimaryKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Match_state_idx" ON "Match"("state");

-- CreateIndex
CREATE INDEX "PointLog_matchId_idx" ON "PointLog"("matchId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
