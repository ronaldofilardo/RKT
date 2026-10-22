-- DEPRECADO (2026-10-22): superseded by prisma/migrations (source of truth). Reference only for manually-configured databases.
ALTER TABLE "Match" ADD COLUMN "isResuming" BOOLEAN DEFAULT false;
ALTER TABLE "Match" ADD COLUMN "openForAnnotation" BOOLEAN DEFAULT false;
ALTER TABLE "Match" ADD COLUMN "tournamentName" TEXT;
ALTER TABLE "Match" ADD COLUMN "round" TEXT;
ALTER TABLE "Match" ADD COLUMN "bracketType" TEXT;
ALTER TABLE "Match" ADD COLUMN "temperature" DOUBLE PRECISION;
ALTER TABLE "Match" ADD COLUMN "humidity" DOUBLE PRECISION;