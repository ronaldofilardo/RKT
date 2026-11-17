-- Migration: 20261117210000_add_guardian_governance_and_status
-- Objetivo:
--   - Regularizar governança de menores / responsáveis legais (ECA Digital & LGPD).
--   - Adicionar novos enums e valores para a tríade de consentimento e esteira de tutela.
--   - Adicionar colunas de status e verificação em guardian_links e Player.guardianGate.
--   - Criar tabelas guardian_invites e consent_events com índices e FKs.
--   - Totalmente idempotente para conviver com banco já atualizado via Neon SQL Editor.

-- 1. Valor novo no enum ConsentPurpose
ALTER TYPE "ConsentPurpose" ADD VALUE IF NOT EXISTS 'STATS';

-- 2. Novos Enums
DO $$ BEGIN
    CREATE TYPE "InviteCreatorKind" AS ENUM ('GESTOR', 'MENOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "GuardianInviteStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'REVOKED', 'SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "GuardianLinkStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED', 'EMANCIPATED', 'DORMANT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "ConsentAction" AS ENUM ('GRANT', 'REVOKE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "GuardianGateStatus" AS ENUM ('AGUARDANDO_RESPONSAVEL', 'LIBERADO', 'RESTRITO', 'LIBERADO_MAIOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Colunas na tabela Player
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "guardianGate" "GuardianGateStatus" NOT NULL DEFAULT 'LIBERADO';

-- 4. Colunas e Índices na tabela guardian_links
ALTER TABLE "guardian_links" 
    ADD COLUMN IF NOT EXISTS "status" "GuardianLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS "verificationLevel" TEXT DEFAULT 'N1_CONVITE',
    ADD COLUMN IF NOT EXISTS "emancipatedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "guardian_links_playerId_status_idx" ON "guardian_links"("playerId", "status");

-- 5. Nova Tabela: guardian_invites
CREATE TABLE IF NOT EXISTS "guardian_invites" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "ctId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdByKind" "InviteCreatorKind" NOT NULL DEFAULT 'GESTOR',
    "preGuardianName" TEXT,
    "preGuardianCpf" TEXT,
    "preGuardianCpfHash" TEXT,
    "preGuardianPhone" TEXT,
    "preGuardianContact" TEXT,
    "tokenHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verificationHoldUntil" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "guardianUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "guardian_invites_tokenHash_key" ON "guardian_invites"("tokenHash");
CREATE INDEX IF NOT EXISTS "guardian_invites_playerId_idx" ON "guardian_invites"("playerId");
CREATE INDEX IF NOT EXISTS "guardian_invites_ctId_idx" ON "guardian_invites"("ctId");
CREATE INDEX IF NOT EXISTS "guardian_invites_preGuardianCpfHash_idx" ON "guardian_invites"("preGuardianCpfHash");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_invites_playerId_fkey') THEN
        ALTER TABLE "guardian_invites" ADD CONSTRAINT "guardian_invites_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_invites_ctId_fkey') THEN
        ALTER TABLE "guardian_invites" ADD CONSTRAINT "guardian_invites_ctId_fkey" FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_invites_createdByUserId_fkey') THEN
        ALTER TABLE "guardian_invites" ADD CONSTRAINT "guardian_invites_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_invites_guardianUserId_fkey') THEN
        ALTER TABLE "guardian_invites" ADD CONSTRAINT "guardian_invites_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Nova Tabela: consent_events
CREATE TABLE IF NOT EXISTS "consent_events" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "action" "ConsentAction" NOT NULL DEFAULT 'GRANT',
    "termsVersion" TEXT NOT NULL,
    "contentHash" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "authMethod" TEXT DEFAULT 'PASSWORD',
    "verificationLevel" TEXT DEFAULT 'N1_CONVITE',
    "inviteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "consent_events_playerId_idx" ON "consent_events"("playerId");
CREATE INDEX IF NOT EXISTS "consent_events_guardianUserId_idx" ON "consent_events"("guardianUserId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_events_playerId_fkey') THEN
        ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_events_guardianUserId_fkey') THEN
        ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_events_inviteId_fkey') THEN
        ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "guardian_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
