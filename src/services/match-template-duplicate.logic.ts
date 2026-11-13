import { prisma } from '@/lib/prisma';
import { canDiscoverMatchTemplate } from '@/core/access/match-event-visibility';
import { getActor } from '@/services/accessService';
import { toTemplateAccess, type TemplateRecord } from './match-resolve-payload.logic';

export async function findAvailableTemplateForMatch(
  player1Id: string,
  player2Id: string,
  scheduledAt: Date | null,
  matchType: 'SINGLES' | 'DOUBLES' = 'SINGLES',
  userId?: string | null,
) {
  if (!scheduledAt || !userId || typeof prisma?.match?.findMany !== 'function') return null;

  const actor = await getActor(userId).catch(() => null);
  if (!actor) return null;

  const windowStart = new Date(scheduledAt);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(scheduledAt);
  windowEnd.setHours(23, 59, 59, 999);

  const candidates = await prisma.match.findMany({
    where: {
      deletedAt: null,
      matchType,
      scheduledAt: { gte: windowStart, lte: windowEnd },
      state: { not: 'CANCELLED' },
      OR: [
        { isTemplate: true },
        { isPublicTemplate: true },
      ],
      AND: [
        {
          OR: [
            { player1Id, player2Id },
            { player1Id: player2Id, player2Id: player1Id },
          ],
        },
      ],
    },
    include: { player1: true, player2: true },
    take: 10,
  });

  return (
    candidates.find((c) => canDiscoverMatchTemplate(actor, toTemplateAccess(c as unknown as TemplateRecord))) ??
    null
  );
}

