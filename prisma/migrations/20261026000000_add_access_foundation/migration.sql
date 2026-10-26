-- PLANO_FUNDACAO_PERFIS_v2 — Fase 1A: fundação de acesso (migração ADITIVA).
-- Nada é removido nem tornado obrigatório; `users.cpf` continua NOT NULL nesta fase.

-- CreateEnum
CREATE TYPE "PlatformPreset" AS ENUM ('ADMIN', 'SUPORTE');
CREATE TYPE "MembershipKind" AS ENUM ('PLATAFORMA', 'GESTOR', 'TREINADOR');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ENDED');
CREATE TYPE "IdentityStatus" AS ENUM ('CONFIRMED', 'PROVISIONAL');
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ResetStatus" AS ENUM ('PENDING', 'LINK_ISSUED', 'DONE', 'REJECTED');
CREATE TYPE "ConsentPurpose" AS ENUM ('DATA');
CREATE TYPE "InviteKind" AS ENUM ('TREINADOR', 'ATLETA', 'GESTOR');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "canOperate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "training_centers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "training_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Player"
  ADD COLUMN "athleteCode" TEXT,
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "clubId" TEXT,
  ADD COLUMN "identityStatus" "IdentityStatus" NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN "mergedIntoId" TEXT;

-- AlterTable
ALTER TABLE "Match"
  ADD COLUMN "ctId" TEXT,
  ADD COLUMN "venueClubId" TEXT;

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "MembershipKind" NOT NULL,
    "preset" "PlatformPreset",
    "ctId" TEXT,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_cts" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "ctId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "player_cts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_links" (
    "id" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "relation" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_invites" (
    "id" TEXT NOT NULL,
    "ctId" TEXT NOT NULL,
    "kind" "InviteKind" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ResetStatus" NOT NULL DEFAULT 'PENDING',
    "contactHint" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestIpHash" TEXT,
    "issuedByUserId" TEXT,
    "tokenHash" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "password_reset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ctId" TEXT,
    "meta" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_centers_slug_key" ON "training_centers"("slug");
CREATE UNIQUE INDEX "clubs_name_city_key" ON "clubs"("name", "city");
CREATE UNIQUE INDEX "Player_athleteCode_key" ON "Player"("athleteCode");
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
CREATE INDEX "Match_ctId_idx" ON "Match"("ctId");
CREATE UNIQUE INDEX "memberships_userId_kind_ctId_key" ON "memberships"("userId", "kind", "ctId");
CREATE INDEX "memberships_userId_status_idx" ON "memberships"("userId", "status");
CREATE INDEX "memberships_ctId_idx" ON "memberships"("ctId");
CREATE UNIQUE INDEX "player_cts_playerId_ctId_key" ON "player_cts"("playerId", "ctId");
CREATE INDEX "player_cts_ctId_idx" ON "player_cts"("ctId");
CREATE INDEX "guardian_links_guardianUserId_idx" ON "guardian_links"("guardianUserId");
CREATE INDEX "guardian_links_playerId_idx" ON "guardian_links"("playerId");
CREATE INDEX "consent_records_playerId_idx" ON "consent_records"("playerId");
CREATE INDEX "athlete_claims_status_idx" ON "athlete_claims"("status");
CREATE INDEX "athlete_claims_playerId_idx" ON "athlete_claims"("playerId");
CREATE UNIQUE INDEX "link_invites_tokenHash_key" ON "link_invites"("tokenHash");
CREATE INDEX "link_invites_ctId_idx" ON "link_invites"("ctId");
CREATE UNIQUE INDEX "password_reset_requests_tokenHash_key" ON "password_reset_requests"("tokenHash");
CREATE INDEX "password_reset_requests_status_requestedAt_idx" ON "password_reset_requests"("status", "requestedAt");
CREATE INDEX "password_reset_requests_userId_idx" ON "password_reset_requests"("userId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_ctId_createdAt_idx" ON "audit_logs"("ctId", "createdAt");
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_ctId_fkey" FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_venueClubId_fkey" FOREIGN KEY ("venueClubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_ctId_fkey" FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_cts" ADD CONSTRAINT "player_cts_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_cts" ADD CONSTRAINT "player_cts_ctId_fkey" FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_claims" ADD CONSTRAINT "athlete_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_claims" ADD CONSTRAINT "athlete_claims_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "link_invites" ADD CONSTRAINT "link_invites_ctId_fkey" FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill (F12): quem usa o app hoje não perde nada.
-- Anotadores, e admins que também criaram/anotaram partidas (P4), viram base operacional.
-- Admins que nunca operaram NÃO recebem canOperate (F3: admin é só operação da plataforma).
UPDATE "users" SET "canOperate" = true
WHERE "role" = 'ANNOTATOR'
   OR EXISTS (SELECT 1 FROM "Match" m WHERE m."createdByUserId" = "users"."id")
   OR EXISTS (SELECT 1 FROM "match_annotation_sessions" s WHERE s."annotatorUserId" = "users"."id");

-- Admins viram PLATAFORMA/ADMIN.
INSERT INTO "memberships" ("id", "userId", "kind", "preset", "status", "createdAt")
SELECT gen_random_uuid()::text, u."id", 'PLATAFORMA'::"MembershipKind", 'ADMIN'::"PlatformPreset",
       'ACTIVE'::"MembershipStatus", CURRENT_TIMESTAMP
FROM "users" u
WHERE u."role" = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."userId" = u."id" AND m."kind" = 'PLATAFORMA'::"MembershipKind" AND m."ctId" IS NULL
  );
