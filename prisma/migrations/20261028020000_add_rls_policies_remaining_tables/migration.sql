-- RLS: Políticas para tabelas restantes da fundação de acesso (R-24 estendido)
-- Tabelas: guardian_links, consent_records, athlete_claims, link_invites,
--          password_reset_requests, audit_logs, clubs, tournaments
-- Variáveis de sessão: app.current_user_id, app.current_user_role

-- 1. guardian_links
-- Usuário lê links onde é guardião ou jogador; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY guardian_links_own_or_platform ON "guardian_links"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "guardianUserId" = current_setting('app.current_user_id', true)::text
      OR "playerId" = current_setting('app.current_user_id', true)::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam guardian_links
DO $$ BEGIN
  CREATE POLICY guardian_links_platform_manage ON "guardian_links"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "guardian_links" ENABLE ROW LEVEL SECURITY;

-- 2. consent_records
-- Usuário lê registros onde é guardião ou jogador; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY consent_records_own_or_platform ON "consent_records"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "guardianUserId" = current_setting('app.current_user_id', true)::text
      OR "playerId" = current_setting('app.current_user_id', true)::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam consent_records
DO $$ BEGIN
  CREATE POLICY consent_records_platform_manage ON "consent_records"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;

-- 3. athlete_claims
-- Usuário lê seus próprios claims (userId); ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY athlete_claims_own_or_platform ON "athlete_claims"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "userId" = current_setting('app.current_user_id', true)::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam athlete_claims
DO $$ BEGIN
  CREATE POLICY athlete_claims_platform_manage ON "athlete_claims"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "athlete_claims" ENABLE ROW LEVEL SECURITY;

-- 4. link_invites
-- Criador lê seus convites; Gestor do CT lê convites do seu CT; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY link_invites_ct_or_platform ON "link_invites"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "createdByUserId" = current_setting('app.current_user_id', true)::text
      OR EXISTS (
        SELECT 1 FROM "memberships"
        WHERE "memberships"."ctId" = "link_invites"."ctId"
          AND "memberships"."kind" = 'GESTOR'
          AND "memberships"."status" = 'ACTIVE'
          AND "memberships"."userId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam link_invites
DO $$ BEGIN
  CREATE POLICY link_invites_platform_manage ON "link_invites"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "link_invites" ENABLE ROW LEVEL SECURITY;

-- 5. password_reset_requests
-- Usuário lê seus próprios pedidos de reset; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY password_reset_requests_own_or_platform ON "password_reset_requests"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "userId" = current_setting('app.current_user_id', true)::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam password_reset_requests
DO $$ BEGIN
  CREATE POLICY password_reset_requests_platform_manage ON "password_reset_requests"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "password_reset_requests" ENABLE ROW LEVEL SECURITY;

-- 6. audit_logs (sem FK: sobrevive à exclusão de contas)
-- Usuário lê seus próprios logs (actorUserId); ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY audit_logs_own_or_platform ON "audit_logs"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "actorUserId" = current_setting('app.current_user_id', true)::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam audit_logs (somente escrita de sistema)
DO $$ BEGIN
  CREATE POLICY audit_logs_platform_manage ON "audit_logs"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 7. clubs
-- Gestor do CT lê clubes do seu CT; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY clubs_ct_or_platform ON "clubs"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR EXISTS (
        SELECT 1 FROM "memberships"
        WHERE "memberships"."ctId" = "clubs"."ctId"
          AND "memberships"."kind" = 'GESTOR'
          AND "memberships"."status" = 'ACTIVE'
          AND "memberships"."userId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam clubs
DO $$ BEGIN
  CREATE POLICY clubs_platform_manage ON "clubs"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "clubs" ENABLE ROW LEVEL SECURITY;

-- 8. tournaments
-- Criador lê seus torneios; Gestor do CT lê torneios do seu CT; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY tournaments_ct_or_platform ON "tournaments"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "createdByUserId" = current_setting('app.current_user_id', true)::text
      OR EXISTS (
        SELECT 1 FROM "memberships"
        WHERE "memberships"."ctId" = "tournaments"."ctId"
          AND "memberships"."kind" = 'GESTOR'
          AND "memberships"."status" = 'ACTIVE'
          AND "memberships"."userId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam tournaments
DO $$ BEGIN
  CREATE POLICY tournaments_platform_manage ON "tournaments"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "tournaments" ENABLE ROW LEVEL SECURITY;
