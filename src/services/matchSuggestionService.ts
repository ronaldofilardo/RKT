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

export { findDuplicateMatch } from './match-duplicate.service';