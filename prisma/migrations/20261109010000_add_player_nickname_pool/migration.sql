-- Nickname de atleta e visibilidade no pool público (S2/A0.14)
ALTER TABLE "Player"
  ADD COLUMN IF NOT EXISTS "nickname" TEXT,
  ADD COLUMN IF NOT EXISTS "poolVisible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "poolVisibleSince" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Player_nickname_key"
  ON "Player"("nickname");

CREATE INDEX IF NOT EXISTS "Player_poolVisible_idx"
  ON "Player"("poolVisible");

-- Novo propósito de consentimento (LGPD): visibilidade no pool de atletas.
ALTER TYPE "ConsentPurpose" ADD VALUE IF NOT EXISTS 'POOL_VISIBILITY';
