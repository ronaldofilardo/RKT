-- Pool de Partidas Públicas (S1/A0.13)
-- Template = cartaz no pool (sem PointLog próprio); derivadas apontam para o template.
ALTER TABLE "Match"
  ADD COLUMN IF NOT EXISTS "isPublicTemplate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sourceMatchId" TEXT;

ALTER TABLE "Match"
  DROP CONSTRAINT IF EXISTS "Match_sourceMatchId_fkey";
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_sourceMatchId_fkey"
  FOREIGN KEY ("sourceMatchId") REFERENCES "Match"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Match_isPublicTemplate_idx"
  ON "Match"("isPublicTemplate");

CREATE INDEX IF NOT EXISTS "Match_sourceMatchId_idx"
  ON "Match"("sourceMatchId");
