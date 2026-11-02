-- Estado e cidade do atleta (para listagem de atletas externos no suporte)
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "state" TEXT;
