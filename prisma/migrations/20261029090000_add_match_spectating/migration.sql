-- AlterEnum
ALTER TYPE "ConsentPurpose" ADD VALUE IF NOT EXISTS 'BROADCAST';

-- AlterTable
ALTER TABLE "PointLog" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PointLog" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill para linhas existentes
UPDATE "PointLog" SET "receivedAt" = "timestamp" WHERE "receivedAt" IS NULL;
UPDATE "PointLog" SET "updatedAt" = "timestamp" WHERE "updatedAt" IS NULL;

-- AlterTable
ALTER TABLE "match_annotation_sessions" ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "match_share_links" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "match_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "match_spectators" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "match_spectators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "match_share_links_tokenHash_key" ON "match_share_links"("tokenHash");
CREATE INDEX IF NOT EXISTS "match_share_links_matchId_revokedAt_idx" ON "match_share_links"("matchId", "revokedAt");
CREATE INDEX IF NOT EXISTS "match_spectators_userId_revokedAt_idx" ON "match_spectators"("userId", "revokedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "match_spectators_matchId_userId_key" ON "match_spectators"("matchId", "userId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_share_links_matchId_fkey') THEN
        ALTER TABLE "match_share_links" ADD CONSTRAINT "match_share_links_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_share_links_createdByUserId_fkey') THEN
        ALTER TABLE "match_share_links" ADD CONSTRAINT "match_share_links_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_spectators_matchId_fkey') THEN
        ALTER TABLE "match_spectators" ADD CONSTRAINT "match_spectators_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_spectators_userId_fkey') THEN
        ALTER TABLE "match_spectators" ADD CONSTRAINT "match_spectators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_spectators_linkId_fkey') THEN
        ALTER TABLE "match_spectators" ADD CONSTRAINT "match_spectators_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "match_share_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

