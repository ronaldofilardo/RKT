-- RLS: Row-Level Security por ownership + role
-- As session variables `app.current_user_id` e `app.current_user_role`
-- são setadas pelo middleware Prisma em src/lib/prisma.ts

-- 1. users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_read_own ON "users"
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id', true)::text
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY user_admin_manage ON "users"
  FOR ALL
  USING (current_setting('app.current_user_role', true) = 'ADMIN');

-- 2. Player (Catálogo compartilhado de atletas)
ALTER TABLE "Player" ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_read_all ON "Player"
  FOR SELECT
  USING (true);

CREATE POLICY player_write_authorized ON "Player"
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'ANNOTATOR'));

-- 3. Match (Isolamento total: apenas o Anotador criador acessa suas partidas. ADMIN NÃO tem acesso!)
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_annotator_own ON "Match"
  FOR ALL
  USING (
    "createdByUserId" = current_setting('app.current_user_id', true)::text
  )
  WITH CHECK (
    "createdByUserId" = current_setting('app.current_user_id', true)::text
  );

-- 4. PointLog
ALTER TABLE "PointLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pointlog_match_access ON "PointLog"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "Match".id = "PointLog"."matchId"
      AND "Match"."createdByUserId" = current_setting('app.current_user_id', true)::text
    )
  );

-- 5. match_annotation_sessions
ALTER TABLE "match_annotation_sessions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_annotator_own ON "match_annotation_sessions"
  FOR ALL
  USING ("annotatorUserId" = current_setting('app.current_user_id', true)::text);

-- 6. annotation_endorsements
ALTER TABLE "annotation_endorsements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY endorsement_own ON "annotation_endorsements"
  FOR ALL
  USING ("endorsedByUserId" = current_setting('app.current_user_id', true)::text);
