import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

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
  matchType: 'SINGLES' | 'DOUBLES' = 'SINGLES',
  player1PartnerId?: string | null,
  player2PartnerId?: string | null,
  tx?: TransactionClient,
) {
  if (!scheduledAt) return null;

  const windowStart = new Date(scheduledAt);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(scheduledAt);
  windowEnd.setHours(23, 59, 59, 999);

  // Simples nunca colide com dupla.
  const baseWhere: Prisma.MatchWhereInput = {
    matchType,
    scheduledAt: {
      gte: windowStart,
      lte: windowEnd,
    },
    state: { not: 'CANCELLED' },
  };

  const client = tx ?? prisma;

  if (matchType === 'SINGLES') {
    const existing = await client.match.findFirst({
      where: {
        ...baseWhere,
        OR: [
          { player1Id, player2Id },
          { player1Id: player2Id, player2Id: player1Id },
        ],
      },
      include: { player1: true, player2: true },
    });
    return existing;
  }

  // Duplas: compara como conjuntos de dois lados, qualquer ordem.
  const p1Side = [player1Id, player1PartnerId].filter(Boolean) as string[];
  const p2Side = [player2Id, player2PartnerId].filter(Boolean) as string[];

  const existing = await client.match.findFirst({
    where: {
      ...baseWhere,
      OR: [
        // Lados na mesma ordem
        {
          player1Id: { in: p1Side },
          player2Id: { in: p2Side },
          player1PartnerId: { in: p1Side },
          player2PartnerId: { in: p2Side },
        },
        // Lados invertidos
        {
          player1Id: { in: p2Side },
          player2Id: { in: p1Side },
          player1PartnerId: { in: p2Side },
          player2PartnerId: { in: p1Side },
        },
      ],
    },
    include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
  });

  return existing;
}