import { prisma } from '@/lib/prisma';

export async function getTournamentSuggestions(query: string) {
  const tournaments = await prisma.match.findMany({
    where: {
      tournamentName: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: { tournamentName: true },
    distinct: ['tournamentName'],
    take: 10,
  });

  const rounds = await prisma.match.findMany({
    where: {
      tournamentName: {
        contains: query,
        mode: 'insensitive',
      },
      round: { not: null },
    },
    select: { round: true },
    distinct: ['round'],
    take: 10,
  });

  return {
    tournaments: tournaments.map((t) => t.tournamentName).filter(Boolean),
    rounds: rounds.map((r) => r.round).filter(Boolean),
  };
}

export async function findDuplicateMatch(
  player1Id: string,
  player2Id: string,
  scheduledAt: Date | null,
) {
  if (!scheduledAt) return null;

  const windowStart = new Date(scheduledAt);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(scheduledAt);
  windowEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { player1Id, player2Id },
        { player1Id: player2Id, player2Id: player1Id },
      ],
      scheduledAt: {
        gte: windowStart,
        lte: windowEnd,
      },
      state: { not: 'CANCELLED' },
    },
    include: { player1: true, player2: true },
  });

  return existing;
}