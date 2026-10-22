-- DEPRECADO (2026-10-22): superseded by prisma/migrations (source of truth). Reference only for manually-configured databases.
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "sportType" TEXT NOT NULL DEFAULT 'TENNIS';