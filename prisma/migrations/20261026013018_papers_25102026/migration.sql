/*
  Warnings:

  - The values [GESTOR,COACH,ATHLETE,SPECTATOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `passwordHash` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Player` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchId,sequenceNumber]` on the table `PointLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- Player.role is removed by this migration, so drop the column before replacing
-- Role; otherwise its dependency prevents dropping the old enum type.
BEGIN;
ALTER TABLE "Player" DROP COLUMN "role";
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'ANNOTATOR');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ANNOTATOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "annotation_endorsements" DROP CONSTRAINT "annotation_endorsements_endorsedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "match_annotation_sessions" DROP CONSTRAINT "match_annotation_sessions_annotatorUserId_fkey";

-- DropIndex
DROP INDEX "Player_email_key";

-- DropIndex
DROP INDEX "PointLog_matchId_sequenceNumber_idx";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "clubName" TEXT,
ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "passwordHash",
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "match_annotation_sessions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "cpf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_ip_createdAt_idx" ON "login_attempts"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_cpf_createdAt_idx" ON "login_attempts"("cpf", "createdAt");

-- CreateIndex
CREATE INDEX "Match_createdByUserId_createdAt_idx" ON "Match"("createdByUserId", "createdAt" DESC);

-- Replace the prior partial unique index with Prisma's non-partial unique index.
BEGIN;
DROP INDEX "PointLog_matchId_sequenceNumber_key";
CREATE UNIQUE INDEX "PointLog_matchId_sequenceNumber_key" ON "PointLog"("matchId", "sequenceNumber");
COMMIT;

-- CreateIndex
CREATE INDEX "match_annotation_sessions_matchId_isActive_idx" ON "match_annotation_sessions"("matchId", "isActive");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_score_edits" ADD CONSTRAINT "match_score_edits_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_annotation_sessions" ADD CONSTRAINT "match_annotation_sessions_annotatorUserId_fkey" FOREIGN KEY ("annotatorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_endorsements" ADD CONSTRAINT "annotation_endorsements_endorsedByUserId_fkey" FOREIGN KEY ("endorsedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
