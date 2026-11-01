import { prisma } from '@/lib/prisma';
import { ensureCanInsertAthletesColumn } from './coaches-migration.logic';
import { createCoach, type CoachInput } from './coaches-create.logic';

export { createCoach, type CoachInput };

export async function listCoaches(ctIds: string[] | string) {
  const ids = Array.isArray(ctIds) ? ctIds : [ctIds];
  await ensureCanInsertAthletesColumn();
  const rows = await prisma.membership.findMany({
    where: { ctId: { in: ids }, kind: 'TREINADOR', status: 'ACTIVE' },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          createdAt: true,
          mustChangePassword: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    canInsertAthletes: (r as any).canInsertAthletes ?? true,
    user: r.user,
  }));
}

export async function updateCoachPermissions(membershipId: string, data: { canInsertAthletes: boolean }) {
  await ensureCanInsertAthletesColumn();
  try {
    await prisma.$executeRaw`UPDATE "memberships" SET "canInsertAthletes" = ${data.canInsertAthletes} WHERE "id" = ${membershipId}`;
  } catch {
    // Coluna ainda não existe no banco; ignora silenciosamente.
  }
  return prisma.membership.findUnique({
    where: { id: membershipId },
    select: { id: true },
  });
}
