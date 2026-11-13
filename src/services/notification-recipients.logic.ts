import type { Prisma } from '@prisma/client';

export async function resolveAthleteAssociatedUserIds(
  athleteIds: string[],
  creatorId: string,
  tx: Prisma.TransactionClient,
): Promise<string[]> {
  const [links, guardians, players, playerCts] = await Promise.all([
    tx.coachAthleteLink.findMany({
      where: { playerId: { in: athleteIds }, status: 'ACTIVE' },
      select: { coachUserId: true },
    }),
    tx.guardianLink.findMany({
      where: { playerId: { in: athleteIds }, revokedAt: null },
      select: { guardianUserId: true },
    }),
    tx.player.findMany({
      where: { id: { in: athleteIds }, userId: { not: null } },
      select: { userId: true },
    }),
    tx.playerCT?.findMany
      ? tx.playerCT.findMany({
          where: { playerId: { in: athleteIds }, status: 'ACTIVE' },
          select: { ctId: true },
        })
      : Promise.resolve([]),
  ]);

  const clubCtIds = Array.from(new Set(playerCts.map((p) => p.ctId)));
  const managerMemberships = clubCtIds.length > 0
    ? await tx.membership.findMany({
        where: { ctId: { in: clubCtIds }, kind: 'GESTOR', status: 'ACTIVE' },
        select: { userId: true },
      })
    : [];

  const recipientIds = new Set<string>([
    ...links.map((l) => l.coachUserId),
    ...guardians.map((g) => g.guardianUserId),
    ...players.map((p) => p.userId!).filter(Boolean),
    ...managerMemberships.map((m) => m.userId),
  ]);
  recipientIds.delete(creatorId);

  return Array.from(recipientIds);
}

