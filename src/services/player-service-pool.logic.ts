import { prisma } from '@/lib/prisma';
import type { PoolPlayerRow } from '@/core/access/pool';

const POOL_SELECT = {
  id: true,
  name: true,
  birthDate: true,
  athleteCode: true,
  club: true,
} as const;

/** Lista de atletas do pool com escopo de CT (toggle "Meu clube") e busca por nome. */
export async function listPoolPlayers({
  cursor,
  limit = 20,
  q,
  ctIds,
}: {
  cursor?: string | null;
  limit?: number;
  q?: string | null;
  ctIds?: string[] | null;
}): Promise<PoolPlayerRow[]> {
  const where: Record<string, unknown> = {};

  if (q) {
    where.name = { contains: q, mode: 'insensitive' };
  }

  if (ctIds && ctIds.length > 0) {
    where.playerCts = {
      some: { ctId: { in: ctIds }, status: 'ACTIVE' },
    };
  }

  return prisma.player.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
    select: POOL_SELECT,
    orderBy: { name: 'asc' },
  });
}
