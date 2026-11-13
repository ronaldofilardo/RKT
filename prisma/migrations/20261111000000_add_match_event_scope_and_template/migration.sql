-- Migration: 20261111000000_add_match_event_scope_and_template
-- Objetivo (PLANO_ISOLAMENTO_ANOTACOES_POR_ANOTADOR Fase 1):
--   - Adicionar enum MatchEventScope e campos isTemplate, eventScope, isOfficialClubAnnotation em Match.
--   - Backfill seguro dos registros legados.
--   - Índice único parcial para garantir no máximo uma anotação ativa por usuário por partida-mãe.

-- 1. Criar o enum MatchEventScope
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MatchEventScope') THEN
    CREATE TYPE "MatchEventScope" AS ENUM (
      'PUBLIC',
      'PRIVATE_CLUB',
      'PRIVATE_COACH',
      'PRIVATE_PLAYERS',
      'PRIVATE_PERSONAL'
    );
  END IF;
END $$;

-- 2. Adicionar novas colunas em "Match"
ALTER TABLE "Match"
  ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "eventScope" "MatchEventScope" NOT NULL DEFAULT 'PRIVATE_PERSONAL',
  ADD COLUMN IF NOT EXISTS "isOfficialClubAnnotation" BOOLEAN NOT NULL DEFAULT false;

-- 3. Backfill seguro de dados legados
--    - Onde isPublicTemplate = true → isTemplate = true, eventScope = 'PUBLIC'.
--    - Onde isPublicTemplate = false e ctId IS NOT NULL → eventScope = 'PRIVATE_CLUB'.
--    - Demais registros legados → eventScope = 'PRIVATE_PERSONAL'.
UPDATE "Match"
SET
  "isTemplate" = true,
  "eventScope" = 'PUBLIC'::"MatchEventScope"
WHERE "isPublicTemplate" = true;

UPDATE "Match"
SET "eventScope" = 'PRIVATE_CLUB'::"MatchEventScope"
WHERE "isPublicTemplate" = false
  AND "ctId" IS NOT NULL;

UPDATE "Match"
SET "eventScope" = 'PRIVATE_PERSONAL'::"MatchEventScope"
WHERE "isPublicTemplate" = false
  AND "ctId" IS NULL;

-- 4. Índice único parcial: no máximo uma anotação ativa por usuário por partida-mãe.
--    Elimina race conditions em cliques duplos no botão "Anotar esta partida".
CREATE UNIQUE INDEX IF NOT EXISTS "Match_unique_active_annotation_per_user_idx"
  ON "Match"("sourceMatchId", "createdByUserId")
  WHERE "sourceMatchId" IS NOT NULL
    AND "deletedAt" IS NULL
    AND "state" <> 'CANCELLED';

-- 5. Índice composto para consultas de templates por escopo
CREATE INDEX IF NOT EXISTS "Match_isTemplate_eventScope_idx"
  ON "Match"("isTemplate", "eventScope");

-- 6. Índice para buscas por criador e sourceMatchId (derivadas do mesmo cartaz)
CREATE INDEX IF NOT EXISTS "Match_createdByUserId_sourceMatchId_idx"
  ON "Match"("createdByUserId", "sourceMatchId");