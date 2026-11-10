-- S3 / S4: Notificações In-App e Mural do Treinador (RKT)
ALTER TABLE "Match"
  ADD COLUMN IF NOT EXISTS "assignedCoachId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Match_assignedCoachId_fkey') THEN
    ALTER TABLE "Match"
      ADD CONSTRAINT "Match_assignedCoachId_fkey"
      FOREIGN KEY ("assignedCoachId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Match_assignedCoachId_idx"
  ON "Match"("assignedCoachId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'POOL_MATCH_WITH_MY_ATHLETE',
      'POOL_MATCH_AVAILABLE',
      'ASSIGNED_TO_ANNOTATE'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id"          TEXT        NOT NULL PRIMARY KEY,
  "recipientId" TEXT        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "type"        "NotificationType" NOT NULL,
  "payload"     JSONB       NOT NULL,
  "readAt"      TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "Notification_recipient_unread_idx"
  ON "Notification"("recipientId", "readAt");

CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx"
  ON "Notification"("createdAt");

