-- Fase 3: Índice de busca por nome em Player (P10 / TD-060)
CREATE INDEX IF NOT EXISTS "Player_name_idx" ON "Player"("name");
