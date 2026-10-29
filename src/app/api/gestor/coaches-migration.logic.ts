import { prisma } from '@/lib/prisma';

let migrationAttempted = false;

export async function ensureCanInsertAthletesColumn() {
  if (migrationAttempted) return;
  migrationAttempted = true;
  try {
    await (prisma as any).$executeRawUnsafe?.(
      'ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "canInsertAthletes" BOOLEAN NOT NULL DEFAULT true;'
    );
  } catch {
    // ignora silenciosamente se o banco não permitir DDL na conexão ou se já existir
  }
}
