-- ============================================================================
-- PR-9: Migration FK e Documentação RLS para match_score_edits
-- Atenção: Não executar automaticamente; aplicar via pipeline/dba quando aprovado.
-- ============================================================================

-- 1. Saneamento prévio de integridade referencial:
-- Remove referências a usuários inexistentes antes da criação da restrição de FK
UPDATE "match_score_edits"
SET "editedByUserId" = NULL
WHERE "editedByUserId" IS NOT NULL
  AND "editedByUserId" NOT IN (SELECT "id" FROM "User");

-- 2. Criação da Foreign Key com ON DELETE SET NULL:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_score_edits_editedByUserId_fkey'
  ) THEN
    ALTER TABLE "match_score_edits"
      ADD CONSTRAINT "match_score_edits_editedByUserId_fkey"
      FOREIGN KEY ("editedByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- Documentação RLS (Decisão do Portão PR-9):
-- O aplicativo conecta ao Neon via Prisma com role administrativa (owner),
-- portanto as regras de autorização são garantidas na camada de aplicação
-- pela função `checkCanModifyMatchState` em rotas /state e /finish.
--
-- Caso o banco passe a utilizar role não-owner ou `FORCE ROW LEVEL SECURITY`,
-- a política recomendada alinhada ao sistema é:
--
-- ALTER TABLE "match_score_edits" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY match_score_edits_policy ON "match_score_edits"
--   USING (
--     current_setting('app.current_user_role', true) = 'ADMIN'
--     OR EXISTS (
--       SELECT 1 FROM "Match" m WHERE m.id = "match_score_edits"."matchId"
--         AND (
--           m."player1Id" = current_setting('app.current_user_id', true)
--           OR m."player2Id" = current_setting('app.current_user_id', true)
--           OR m."player1PartnerId" = current_setting('app.current_user_id', true)
--           OR m."player2PartnerId" = current_setting('app.current_user_id', true)
--           OR m."createdByUserId" = current_setting('app.current_user_id', true)
--           OR m."openForAnnotation" = true
--         )
--     )
--   );
-- ============================================================================

-- ============================================================================
-- NOTA DE ROLLBACK:
-- Para reverter a adição da Foreign Key caso necessário:
-- ALTER TABLE "match_score_edits" DROP CONSTRAINT IF EXISTS "match_score_edits_editedByUserId_fkey";
-- ============================================================================
