import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

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

  const p1Side = [player1Id, player1PartnerId].filter(Boolean) as string[];
  const p2Side = [player2Id, player2PartnerId].filter(Boolean) as string[];

  const existing = await client.match.findFirst({
    where: {
      ...baseWhere,
      OR: [
        {
          player1Id: { in: p1Side },
          player2Id: { in: p2Side },
          player1PartnerId: { in: p1Side },
          player2PartnerId: { in: p2Side },
        },
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
