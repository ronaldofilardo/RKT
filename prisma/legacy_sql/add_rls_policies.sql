-- RLS: Row-Level Security por ownership + role (sem clubId)
-- As session variables `app.current_user_id` e `app.current_user_role`
-- são setadas pelo middleware Prisma em src/lib/prisma.ts

-- Player
ALTER TABLE "Player" ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_own ON "Player"
  FOR ALL
  USING (id = current_setting('app.current_user_id', true)::text);

CREATE POLICY player_admin ON "Player"
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'GESTOR'));

-- Match
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_own ON "Match"
  FOR ALL
  USING (
    player1Id = current_setting('app.current_user_id', true)::text
    OR player2Id = current_setting('app.current_user_id', true)::text
  );

CREATE POLICY match_public ON "Match"
  FOR SELECT
  USING (visibility = 'PUBLIC');

CREATE POLICY match_staff ON "Match"
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'GESTOR', 'COACH'));

-- PointLog
ALTER TABLE "PointLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pointlog_match_access ON "PointLog"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "Match".id = "PointLog"."matchId"
      AND (
        "Match".player1Id = current_setting('app.current_user_id', true)::text
        OR "Match".player2Id = current_setting('app.current_user_id', true)::text
        OR "Match".visibility = 'PUBLIC'
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'GESTOR', 'COACH')
      )
    )
  );

-- match_annotation_sessions
ALTER TABLE "match_annotation_sessions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_own ON "match_annotation_sessions"
  FOR ALL
  USING ("annotatorUserId" = current_setting('app.current_user_id', true)::text);

CREATE POLICY session_staff ON "match_annotation_sessions"
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'GESTOR', 'COACH'));

-- annotation_endorsements
ALTER TABLE "annotation_endorsements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY endorsement_own ON "annotation_endorsements"
  FOR ALL
  USING ("endorsedByUserId" = current_setting('app.current_user_id', true)::text);

CREATE POLICY endorsement_session_access ON "annotation_endorsements"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "match_annotation_sessions"
      WHERE "match_annotation_sessions".id = "annotation_endorsements"."sessionId"
      AND (
        "match_annotation_sessions"."annotatorUserId" = current_setting('app.current_user_id', true)::text
        OR current_setting('app.current_user_role', true) IN ('ADMIN', 'GESTOR', 'COACH')
      )
    )
  );
