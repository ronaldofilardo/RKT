-- RLS: Políticas para tabelas de Gestor/Clube (R-24 estendido)
-- Tabelas: training_centers, player_cts, memberships
-- Variáveis de sessão: app.current_user_id, app.current_user_role

-- 1. training_centers
-- Gestor do CT lê seu CT; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY tc_gestor_or_platform_read ON "training_centers"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR EXISTS (
        SELECT 1 FROM "memberships"
        WHERE "memberships"."ctId" = "training_centers"."id"
          AND "memberships"."kind" = 'GESTOR'
          AND "memberships"."status" = 'ACTIVE'
          AND "memberships"."userId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam (criar/atualizar/excluir)
DO $$ BEGIN
  CREATE POLICY tc_platform_manage ON "training_centers"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "training_centers" ENABLE ROW LEVEL SECURITY;

-- 2. player_cts
-- Gestor do CT lê PlayerCTs do seu CT; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY pct_gestor_or_platform_read ON "player_cts"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR EXISTS (
        SELECT 1 FROM "memberships"
        WHERE "memberships"."ctId" = "player_cts"."ctId"
          AND "memberships"."kind" = 'GESTOR'
          AND "memberships"."status" = 'ACTIVE'
          AND "memberships"."userId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam player_cts
DO $$ BEGIN
  CREATE POLICY pct_platform_manage ON "player_cts"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "player_cts" ENABLE ROW LEVEL SECURITY;

-- 3. memberships
-- Usuário lê sua própria membership; Gestor lê memberships do seu CT; ADMIN/SUPORTE leem todos
DO $$ BEGIN
  CREATE POLICY membership_own_or_gestor_or_platform ON "memberships"
    FOR SELECT
    USING (
      current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE')
      OR "userId" = current_setting('app.current_user_id', true)::text
      OR EXISTS (
        SELECT 1 FROM "memberships" AS m2
        WHERE m2."ctId" = "memberships"."ctId"
          AND m2."kind" = 'GESTOR'
          AND m2."status" = 'ACTIVE'
          AND m2."userId" = current_setting('app.current_user_id', true)::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apenas ADMIN/SUPORTE gerenciam memberships
DO $$ BEGIN
  CREATE POLICY membership_platform_manage ON "memberships"
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPORTE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
