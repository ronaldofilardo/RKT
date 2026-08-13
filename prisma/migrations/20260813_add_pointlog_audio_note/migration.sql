-- Add audio note columns to PointLog
-- Schema foi atualizado no commit e8a8f17 mas a migration nunca foi criada,
-- causando P2022 ("column PointLog.audioNote does not exist") em produção
-- ao chamar prisma.pointLog.create() a partir de POST /api/matches/[id]/point.

ALTER TABLE "PointLog" ADD COLUMN "audioNote"         BYTEA,
ADD COLUMN "audioNoteMime"     TEXT,
ADD COLUMN "audioNoteDuration" INTEGER;
