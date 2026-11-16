import { prisma } from '@/lib/prisma';

export interface GuardianDependentMatchItem {
  id: string;
  dependentPlayerId: string;
  dependentName: string;
  opponentName: string;
  format: string;
  state: string;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  createdByName: string;
  annotatorName: string;
  trainingCenterName: string | null;
}

export async function getGuardianMatches(guardianUserId: string): Promise<GuardianDependentMatchItem[]> {
  const links = await prisma.guardianLink.findMany({
    where: { guardianUserId, status: 'ACTIVE', revokedAt: null },
    select: { playerId: true, player: { select: { id: true, name: true } } },
  });

  if (links.length === 0) return [];

  const dependentMap = new Map(links.map((l) => [l.playerId, l.player.name]));
  const playerIds = Array.from(dependentMap.keys());

  const matches = await prisma.match.findMany({
    where: {
      deletedAt: null,
      OR: [
        { player1Id: { in: playerIds } },
        { player2Id: { in: playerIds } },
      ],
    },
    select: {
      id: true,
      state: true,
      format: true,
      scheduledAt: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      player1Id: true,
      player2Id: true,
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, name: true } },
      assignedCoach: { select: { id: true, name: true } },
      ct: { select: { id: true, name: true } },
    },
    orderBy: [
      { scheduledAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });

  return matches.map((m) => {
    const isP1 = dependentMap.has(m.player1Id);
    const dependentName = isP1 ? m.player1.name : m.player2.name;
    const dependentPlayerId = isP1 ? m.player1Id : m.player2Id;
    const opponentName = isP1 ? m.player2.name : m.player1.name;

    return {
      id: m.id,
      dependentPlayerId,
      dependentName,
      opponentName,
      format: m.format,
      state: m.state,
      scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
      startedAt: m.startedAt ? m.startedAt.toISOString() : null,
      finishedAt: m.finishedAt ? m.finishedAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      createdByName: m.createdByUser?.name || 'Clube / CT',
      annotatorName: m.assignedCoach?.name || m.createdByUser?.name || 'Anotador do Clube',
      trainingCenterName: m.ct?.name || null,
    };
  });
}
