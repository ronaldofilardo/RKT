-- Fase 2: Pool, CPF (Hash/Last2) e athleteCode seguro
ALTER TABLE "Player" ADD COLUMN "cpfHash" TEXT;
ALTER TABLE "Player" ADD COLUMN "cpfLast2" TEXT;

CREATE INDEX IF NOT EXISTS "Player_cpfHash_idx" ON "Player"("cpfHash") WHERE "cpfHash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Player_cpfLast2_idx" ON "Player"("cpfLast2") WHERE "cpfLast2" IS NOT NULL;

-- Clube <-> CT (único)
ALTER TABLE "clubs" ADD COLUMN "ctId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "clubs_ctId_key" ON "clubs"("ctId") WHERE "ctId" IS NOT NULL;
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_ctId_fkey" FOREIGN KEY ("ctId") REFERENCES "training_centers"("id") ON DELETE SET NULL;
