-- CreateTable
CREATE TABLE "match_score_edits" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "editedByUserId" TEXT,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousScoreState" JSONB NOT NULL,
    "newScoreState" JSONB NOT NULL,
    "note" TEXT,

    CONSTRAINT "match_score_edits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_score_edits_matchId_idx" ON "match_score_edits"("matchId");

-- CreateIndex
CREATE INDEX "match_score_edits_matchId_editedAt_idx" ON "match_score_edits"("matchId", "editedAt");

-- AddForeignKey
ALTER TABLE "match_score_edits" ADD CONSTRAINT "match_score_edits_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
