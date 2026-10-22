-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('SINGLES', 'DOUBLES');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "matchType" "MatchType" NOT NULL DEFAULT 'SINGLES',
ADD COLUMN "player1PartnerId" TEXT,
ADD COLUMN "player2PartnerId" TEXT,
ADD COLUMN "doublesSetup" JSONB;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1PartnerId_fkey" FOREIGN KEY ("player1PartnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2PartnerId_fkey" FOREIGN KEY ("player2PartnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
