-- Migration: 20261119100000_add_unique_active_annotation_per_annotator
-- Objetivo:
--   1. Eliminar duplicações de cópias ativas concorrentes do mesmo anotador para o mesmo cartaz.
--   2. Higienizar previamente duplicatas acidentais existentes na base (sem pontos).
--   3. Criar índice único parcial no PostgreSQL:
--      (sourceMatchId, createdByUserId) WHERE "deletedAt" IS NULL AND "state" != 'CANCELLED'

-- 1. Higienização prévia idempotente de duplicatas ativas sem pontos
-- Se houver duas ou mais anotações ativas do mesmo usuário para o mesmo cartaz,
-- mantém a com pontos ou a mais antiga, e cancela as cópias vazias excedentes.
WITH RankedDuplicates AS (
    SELECT
        m."id",
        ROW_NUMBER() OVER (
            PARTITION BY m."sourceMatchId", m."createdByUserId"
            ORDER BY
                (SELECT COUNT(*) FROM "PointLog" p WHERE p."matchId" = m."id") DESC,
                m."createdAt" ASC
        ) as rn
    FROM "Match" m
    WHERE m."sourceMatchId" IS NOT NULL
      AND m."createdByUserId" IS NOT NULL
      AND m."deletedAt" IS NULL
      AND m."state" != 'CANCELLED'
)
UPDATE "Match"
SET "state" = 'CANCELLED'
WHERE "id" IN (
    SELECT "id" FROM RankedDuplicates WHERE rn > 1
);

-- 2. Criação do índice único parcial
CREATE UNIQUE INDEX IF NOT EXISTS "Match_sourceMatchId_createdByUserId_active_key"
    ON "Match" ("sourceMatchId", "createdByUserId")
    WHERE "sourceMatchId" IS NOT NULL
      AND "createdByUserId" IS NOT NULL
      AND "deletedAt" IS NULL
      AND "state" != 'CANCELLED';
