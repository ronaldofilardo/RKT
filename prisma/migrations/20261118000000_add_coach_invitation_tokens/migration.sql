-- Migration: 20261118000000_add_coach_invitation_tokens
-- Objetivo: A0.21 (Fase 2) — convite assinado pelo responsável legal para
--   treinador/clube externo indicado durante o cadastro em /signup.
--   Idempotente, no mesmo padrão das migrations anteriores.

CREATE TABLE IF NOT EXISTS "coach_invitation_tokens" (
    "id" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachName" TEXT,
    "coachPhone" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_invitation_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coach_invitation_tokens_tokenHash_key" ON "coach_invitation_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "coach_invitation_tokens_playerId_idx" ON "coach_invitation_tokens"("playerId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coach_invitation_tokens_guardianUserId_fkey') THEN
        ALTER TABLE "coach_invitation_tokens" ADD CONSTRAINT "coach_invitation_tokens_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coach_invitation_tokens_playerId_fkey') THEN
        ALTER TABLE "coach_invitation_tokens" ADD CONSTRAINT "coach_invitation_tokens_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
