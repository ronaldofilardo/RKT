-- RLS: Row-Level Security por ownership + role (R-24)
-- Variáveis de sessão setadas por src/lib/prisma.ts via set_config:
--   app.current_user_id, app.current_user_role
--
-- Idempotente: CREATE POLICY envolvido em DO/EXCEPTION para tolerar
-- bancos onde as policies de prisma/legacy_sql/add_rls_policies.sql
-- já foram aplicadas manualmente (produção).

-- 1. users
DO $$ BEGIN
  CREATE POLICY user_read_own ON "users"
    FOR SELECT
    USING (
      id = current_setting('app.current_user_id', true)::text
      OR current_setting('app.current_user_role', true) = 'ADMIN'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY user_admin_manage ON "users"
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 2. Player (catálogo compartilhado de atletas)
DO $$ BEGIN
  CREATE POLICY player_read_all ON "Player"
    FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY player_write_authorized ON "Player"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'ANNOTATOR'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Player" ENABLE ROW LEVEL SECURITY;

-- 3. Match (isolamento total por criador; ADMIN não acessa via RLS)
DO $$ BEGIN
  CREATE POLICY match_annotator_own ON "Match"
    FOR ALL
    USING (
      "createdByUserId" = current_setting('app.current_user_id', true)::text
    )
    WITH CHECK (
      "createdByUserId" = current_setting('app.current_user_id', true)::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;

-- 4. PointLog (acesso via ownership do Match)
DO $$ BEGIN
  CREATE POLICY pointlog_match_access ON "PointLog"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "Match"
        WHERE "Match".id = "PointLog"."matchId"
        AND "Match"."createdByUserId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "PointLog" ENABLE ROW LEVEL SECURITY;

-- 5. match_annotation_sessions
DO $$ BEGIN
  CREATE POLICY session_annotator_own ON "match_annotation_sessions"
    FOR ALL
    USING ("annotatorUserId" = current_setting('app.current_user_id', true)::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "match_annotation_sessions" ENABLE ROW LEVEL SECURITY;

-- 6. annotation_endorsements
DO $$ BEGIN
  CREATE POLICY endorsement_own ON "annotation_endorsements"
    FOR ALL
    USING ("endorsedByUserId" = current_setting('app.current_user_id', true)::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "annotation_endorsements" ENABLE ROW LEVEL SECURITY;

-- 7. match_score_edits (acesso via ownership do Match; tabela pós-legacy)
DO $$ BEGIN
  CREATE POLICY score_edit_match_access ON "match_score_edits"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "Match"
        WHERE "Match".id = "match_score_edits"."matchId"
        AND "Match"."createdByUserId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "match_score_edits" ENABLE ROW LEVEL SECURITY;

-- 8. match_comments (acesso via ownership do Match; tabela pós-legacy)
DO $$ BEGIN
  CREATE POLICY comment_match_access ON "match_comments"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "Match"
        WHERE "Match".id = "match_comments"."matchId"
        AND "Match"."createdByUserId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "match_comments" ENABLE ROW LEVEL SECURITY;
