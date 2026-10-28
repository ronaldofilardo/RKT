-- Unicidade de Treinador Avulso: um usuário só pode ter um vínculo ativo de TREINADOR com ctId nulo
CREATE UNIQUE INDEX IF NOT EXISTS "unique_coach_avulso" 
ON "memberships"("userId") 
WHERE "ctId" IS NULL AND "status" = 'ACTIVE' AND "kind" = 'TREINADOR';
