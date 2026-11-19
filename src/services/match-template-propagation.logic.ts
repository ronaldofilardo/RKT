import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const STRUCTURAL_FIELDS = [
  'player1Id', 'player2Id', 'player1PartnerId', 'player2PartnerId',
  'format', 'courtType', 'sportType', 'matchType',
] as const;

export const METADATA_FIELDS = [
  'scheduledAt', 'tournamentName', 'clubName', 'category', 'round',
  'venueClubId', 'temperature', 'humidity', 'details',
] as const;

export const PROPAGABLE_FIELDS = [...STRUCTURAL_FIELDS, ...METADATA_FIELDS] as const;
export type PropagableField = (typeof PROPAGABLE_FIELDS)[number];

function pickFields<T extends string>(updated: Record<string, unknown>, fields: readonly T[]): Partial<Record<T, unknown>> {
  const result: Partial<Record<T, unknown>> = {};
  for (const field of fields) {
    if (updated[field] !== undefined) result[field] = updated[field];
  }
  return result;
}

export function pickPropagableFields(updated: Record<string, unknown>) {
  return pickFields(updated, PROPAGABLE_FIELDS);
}

export function pickMetadataFields(updated: Record<string, unknown>) {
  return pickFields(updated, METADATA_FIELDS);
}

type PrismaLike = { match: { updateMany: typeof prisma.match.updateMany } };

/**
 * Propaga atualizações do cartaz para derivadas:
 * - SCHEDULED: propaga todos os campos (estruturais e metadados).
 * - IN_PROGRESS: propaga APENAS metadados (congelando atletas, formato e regras de jogo).
 * - FINISHED/CANCELLED: intocadas (soberania do histórico).
 */
export async function propagateTemplateUpdate(
  templateId: string,
  updated: Record<string, unknown>,
  tx?: PrismaLike,
): Promise<{ propagated: number; scheduledCount: number; inProgressCount: number }> {
  const allPicked = pickPropagableFields(updated);
  if (Object.keys(allPicked).length === 0) {
    return { propagated: 0, scheduledCount: 0, inProgressCount: 0 };
  }

  const client: PrismaLike = tx ?? prisma;
  const { count: scheduledCount } = await client.match.updateMany({
    where: { sourceMatchId: templateId, state: 'SCHEDULED', deletedAt: null },
    data: allPicked as Prisma.MatchUpdateManyMutationInput,
  });

  const metaPicked = pickMetadataFields(updated);
  let inProgressCount = 0;
  if (Object.keys(metaPicked).length > 0) {
    const res = await client.match.updateMany({
      where: { sourceMatchId: templateId, state: 'IN_PROGRESS', deletedAt: null },
      data: metaPicked as Prisma.MatchUpdateManyMutationInput,
    });
    inProgressCount = res.count;
  }

  return { propagated: scheduledCount + inProgressCount, scheduledCount, inProgressCount };
}
