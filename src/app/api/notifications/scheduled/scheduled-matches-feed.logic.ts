import { prisma } from '@/lib/prisma';
import type { Actor } from '@/core/access';
import { resolveCreatorRoleLabel } from '@/app/gestor/gestor-match-display.logic';
import {
  buildDismissedKeys,
  isMatchDismissed,
  deduplicateFeedItems,
} from './scheduled-matches-dedup.logic';

export async function loadScheduledMatchesFeed(actor: Actor) {
  if (actor.activeArea === 'GESTOR') return [];

  const [existingNotifs, dismissed] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: actor.userId, type: 'POOL_MATCH_WITH_MY_ATHLETE', readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.findMany({
      where: { recipientId: actor.userId, readAt: { not: null } },
      select: { payload: true },
    }),
  ]);

  const dismissedKeys = buildDismissedKeys(dismissed);
  const rawDismissedIds = Array.from(
    new Set(dismissed.map((n) => (n.payload as Record<string, any>)?.matchId).filter(Boolean)),
  );
  const coveredMatchIds = new Set(
    existingNotifs.map((n) => (n.payload as Record<string, any>)?.matchId).filter(Boolean),
  );

  const relevantPlayerIds = Array.from(new Set([
    actor.athletePlayerId,
    ...(actor.followedPlayerIds || []),
    ...(actor.guardianOfPlayerIds || []),
  ].filter(Boolean))) as string[];

  if (relevantPlayerIds.length === 0) return deduplicateFeedItems(existingNotifs);

  const matches = await prisma.match.findMany({
    where: {
      deletedAt: null,
      state: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      createdByUserId: { not: actor.userId },
      id: { notIn: rawDismissedIds },
      OR: [
        { player1Id: { in: relevantPlayerIds } },
        { player2Id: { in: relevantPlayerIds } },
        { player1PartnerId: { in: relevantPlayerIds } },
        { player2PartnerId: { in: relevantPlayerIds } },
      ],
    },
    select: {
      id: true, scheduledAt: true, format: true, tournamentName: true,
      createdAt: true, createdByUserId: true, isTemplate: true, sourceMatchId: true,
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
      createdByUser: {
        select: {
          name: true, role: true,
          memberships: { where: { status: 'ACTIVE' }, select: { kind: true, ct: { select: { name: true } } } },
          athleteProfile: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const dynamicItems = matches
    .filter((m) => !coveredMatchIds.has(m.id) && !isMatchDismissed(m, dismissedKeys))
    .map((m) => ({
      id: `match-scheduled-${m.id}`,
      recipientId: actor.userId,
      type: 'POOL_MATCH_WITH_MY_ATHLETE',
      payload: {
        matchId: m.id,
        templateId: m.sourceMatchId ?? m.id,
        player1Name: m.player1?.name ?? 'Jogador 1',
        player2Name: m.player2?.name ?? 'Jogador 2',
        createdByName: m.createdByUser?.name ?? 'Outro usuário',
        creatorRole: resolveCreatorRoleLabel(m.createdByUser),
        scheduledAt: m.scheduledAt?.toISOString(),
        tournamentName: m.tournamentName ?? undefined,
      },
      readAt: null,
      createdAt: m.createdAt,
      expiresAt: null,
    }));

  return deduplicateFeedItems([...existingNotifs, ...dynamicItems]).slice(0, 20);
}
