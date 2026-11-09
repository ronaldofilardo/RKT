import { prisma } from '@/lib/prisma';

/** Usuários-membros ativos de um CT (gestores, treinadores e atletas vinculados). */
export async function loadCtMemberUserIds(ctId: string): Promise<string[]> {
  const [memberships, playerCts] = await Promise.all([
    prisma.membership.findMany({
      where: { ctId, status: 'ACTIVE' },
      select: { userId: true },
    }),
    prisma.playerCT.findMany({
      where: { ctId, status: 'ACTIVE' },
      select: { player: { select: { userId: true } } },
    }),
  ]);

  const athleteUserIds = playerCts
    .map((row) => row.player.userId)
    .filter((id): id is string => Boolean(id));

  return [...new Set([...memberships.map((m) => m.userId), ...athleteUserIds])];
}
