-- CreateTable
CREATE TABLE "match_comments" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "pointId" TEXT,
    "audioNote" BYTEA,
    "audioNoteMime" TEXT,
    "audioNoteDuration" INTEGER,

    CONSTRAINT "match_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_comments_matchId_createdAt_idx" ON "match_comments"("matchId", "createdAt");

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "PointLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
