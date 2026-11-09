import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Campos do cartaz que se propagam para as anotações ativas. */
export const PROPAGABLE_FIELDS = [
  'player1Id',
  'player2Id',
  'player1PartnerId',
  'player2PartnerId',
  'format',
  'courtType',
  'sportType',
  'matchType',
  'scheduledAt',
  'tournamentName',
  'clubName',
  'category',
  'round',
  'venueClubId',
  'temperature',
  'humidity',
  'details',
] as const;

export type PropagableField = (typeof PROPAGABLE_FIELDS)[number];

/** Extrai somente os campos propagáveis presentes no objeto atualizado. */
export function pickPropagableFields(
  updated: Record<string, unknown>,
): Partial<Record<PropagableField, unknown>> {
  const result: Partial<Record<PropagableField, unknown>> = {};
  for (const field of PROPAGABLE_FIELDS) {
    if (updated[field] !== undefined) result[field] = updated[field];
  }
  return result;
}

type PrismaLike = { match: { updateMany: typeof prisma.match.updateMany } };

/**
 * Propaga metadados do template para derivadas em SCHEDULED/IN_PROGRESS.
 * Derivadas FINISHED/CANCELLED permanecem intocadas (soberania da anotação).
 */
export async function propagateTemplateUpdate(
  templateId: string,
  updated: Record<string, unknown>,
  tx?: PrismaLike,
): Promise<{ propagated: number }> {
  const picked = pickPropagableFields(updated);
  if (Object.keys(picked).length === 0) return { propagated: 0 };
  const data = picked as Prisma.MatchUpdateManyMutationInput;

  const client: PrismaLike = tx ?? prisma;
  const { count } = await client.match.updateMany({
    where: {
      sourceMatchId: templateId,
      state: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      deletedAt: null,
    },
    data,
  });

  return { propagated: count };
}
