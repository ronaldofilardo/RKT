-- Create enum for annotation session status
CREATE TYPE "AnnotationSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable: match_annotation_sessions
CREATE TABLE "match_annotation_sessions" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "annotatorUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "matchStateSnapshot" TEXT,
    "finalStateSnapshot" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "AnnotationSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_annotation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: annotation_endorsements
CREATE TABLE "annotation_endorsements" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "endorsedByUserId" TEXT NOT NULL,
    "endorsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotation_endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: match_annotation_sessions
CREATE INDEX "match_annotation_sessions_matchId_idx" ON "match_annotation_sessions"("matchId");
CREATE INDEX "match_annotation_sessions_annotatorUserId_idx" ON "match_annotation_sessions"("annotatorUserId");
CREATE INDEX "match_annotation_sessions_isActive_idx" ON "match_annotation_sessions"("isActive");

-- CreateIndex: annotation_endorsements
CREATE UNIQUE INDEX "annotation_endorsements_sessionId_endorsedByUserId_key" ON "annotation_endorsements"("sessionId", "endorsedByUserId");

-- AddForeignKey: match_annotation_sessions
ALTER TABLE "match_annotation_sessions" 
ADD CONSTRAINT "match_annotation_sessions_matchId_fkey" 
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "match_annotation_sessions" 
ADD CONSTRAINT "match_annotation_sessions_annotatorUserId_fkey" 
FOREIGN KEY ("annotatorUserId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: annotation_endorsements
ALTER TABLE "annotation_endorsements" 
ADD CONSTRAINT "annotation_endorsements_sessionId_fkey" 
FOREIGN KEY ("sessionId") REFERENCES "match_annotation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "annotation_endorsements" 
ADD CONSTRAINT "annotation_endorsements_endorsedByUserId_fkey" 
FOREIGN KEY ("endorsedByUserId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;