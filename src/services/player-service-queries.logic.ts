import { prisma } from '@/lib/prisma';

export async function listPlayers(cursor?: string | null, limit = 20, userId?: string | null) {
  return prisma.player.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: userId ? { createdByUserId: userId } : {},
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true },
    orderBy: { name: 'asc' },
  });
}

export async function findPlayerByEmail(email: string) {
  return prisma.player.findFirst({
    where: { email },
    select: { id: true, name: true, email: true },
  });
}

export async function getPlayerById(id: string) {
  return prisma.player.findUnique({
    where: { id },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, createdByUserId: true },
  });
}

export async function countPlayerActiveMatches(playerId: string) {
  const groups = await prisma.match.groupBy({
    by: ['state'],
    where: {
      deletedAt: null,
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
    },
    _count: { _all: true },
  });
  return groups.map((g) => ({ state: g.state, count: g._count._all }));
}
