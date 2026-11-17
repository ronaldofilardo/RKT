-- Migration: 20261117000000_add_match_assigned_coaches
-- Objetivo:
--   - Permitir múltiplos treinadores anotadores designados por partida/cartaz (N:N).
--   - Criar tabela MatchAssignedCoach com FKs, índices e constraint única (matchId, coachId).
--   - Backfill seguro sem perda de dados: copia todo assignedCoachId existente para MatchAssignedCoach.
--   - Mantém Match.assignedCoachId intacto para compatibilidade retroativa plena.

-- 1. Criar a tabela MatchAssignedCoach
CREATE TABLE IF NOT EXISTS "MatchAssignedCoach" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchAssignedCoach_pkey" PRIMARY KEY ("id")
);

-- 2. Constraints de FK com CASCADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MatchAssignedCoach_matchId_fkey'
    ) THEN
        ALTER TABLE "MatchAssignedCoach"
            ADD CONSTRAINT "MatchAssignedCoach_matchId_fkey"
            FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MatchAssignedCoach_coachId_fkey'
    ) THEN
        ALTER TABLE "MatchAssignedCoach"
            ADD CONSTRAINT "MatchAssignedCoach_coachId_fkey"
            FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Índices e Constraint Única
CREATE UNIQUE INDEX IF NOT EXISTS "MatchAssignedCoach_matchId_coachId_key"
    ON "MatchAssignedCoach"("matchId", "coachId");

CREATE INDEX IF NOT EXISTS "MatchAssignedCoach_matchId_idx"
    ON "MatchAssignedCoach"("matchId");

CREATE INDEX IF NOT EXISTS "MatchAssignedCoach_coachId_idx"
    ON "MatchAssignedCoach"("coachId");

-- 4. Backfill seguro e idempotente de registros existentes
INSERT INTO "MatchAssignedCoach" ("id", "matchId", "coachId", "assignedBy", "createdAt")
SELECT
    'mac_' || substr(md5(random()::text || clock_timestamp()::text || m."id"), 1, 24),
    m."id",
    m."assignedCoachId",
    m."createdByUserId",
    COALESCE(m."createdAt", NOW())
FROM "Match" m
WHERE m."assignedCoachId" IS NOT NULL
ON CONFLICT ("matchId", "coachId") DO NOTHING;
