import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function listPlayers(
  cursor?: string | null,
  limit = 20,
  userId?: string | null,
  followedPlayerIds?: readonly string[] | null,
) {
  const whereClause: Prisma.PlayerWhereInput =
    followedPlayerIds !== undefined && followedPlayerIds !== null
      ? { id: { in: [...followedPlayerIds] } }
      : userId
      ? {
          OR: [
            { createdByUserId: userId },
            { coachAthleteLinks: { some: { coachUserId: userId, status: 'ACTIVE' } } },
          ],
        }
      : {};

  return prisma.player.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: whereClause,
    select: {
      id: true, name: true, gender: true, age: true, birthDate: true, dominance: true,
      backhand: true, ranking: true, rankings: true, club: true, clubId: true,
      city: true, state: true, createdAt: true, createdByUserId: true, nickname: true,
      cpf: true, cpfLast2: true,
      user: { select: { cpf: true, mustChangePassword: true } },
      playerCts: { select: { ctId: true } },
    },
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
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, clubId: true, createdByUserId: true, userId: true, nickname: true, poolVisible: true, poolVisibleSince: true },
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
