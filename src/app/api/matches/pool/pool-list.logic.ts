import { prisma } from '@/lib/prisma';

/**
 * Lista o pool global de cartazes públicos (sem filtro de CT).
 * Ordenação: agendadas mais recentes primeiro, sem data por último.
 */
export async function listPublicPool({
  cursor,
  limit = 20,
}: {
  cursor?: string | null;
  limit?: number;
}) {
  const rows = await prisma.match.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: { isPublicTemplate: true, deletedAt: null },
    orderBy: [{ scheduledAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    select: {
      id: true,
      format: true,
      matchType: true,
      sportType: true,
      courtType: true,
      scheduledAt: true,
      tournamentName: true,
      clubName: true,
      category: true,
      round: true,
      ctId: true,
      createdAt: true,
      player1: { select: { id: true, name: true, nickname: true } },
      player2: { select: { id: true, name: true, nickname: true } },
      _count: { select: { annotations: true } },
    },
  });

  return rows.map(({ _count, ...rest }) => ({
    ...rest,
    annotationCount: _count.annotations,
  }));
}

export type PublicPoolItem = Awaited<ReturnType<typeof listPublicPool>>[number];
