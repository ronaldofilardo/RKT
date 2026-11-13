import { prisma } from '@/lib/prisma';
import { loadGestorExternalScheduledMatches } from './gestor-external-matches.logic';
import { resolveCreatorRoleLabel } from '@/app/gestor/gestor-match-display.logic';
import { GESTOR_MATCH_SELECT } from './gestor-matches-select';

async function queryClubMatches(ctId: string, clubUserIds: string[], clubPlayerIds: string[]) {
  const athleteCond = clubPlayerIds.length > 0 ? [
    { player1Id: { in: clubPlayerIds } }, { player2Id: { in: clubPlayerIds } },
    { player1PartnerId: { in: clubPlayerIds } }, { player2PartnerId: { in: clubPlayerIds } },
  ] : [];

  const rows = await prisma.match.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ctId }, ...(clubUserIds.length > 0 ? [{ createdByUserId: { in: clubUserIds } }] : []),
        { sourceMatch: { ctId, eventScope: 'PRIVATE_CLUB' } }, ...athleteCond,
      ],
    },
    select: GESTOR_MATCH_SELECT,
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  return rows.map(({ _count, ...m }) => ({
    ...m,
    pointCount: _count?.pointLog ?? 0,
    creatorRoleLabel: resolveCreatorRoleLabel(m.createdByUser),
    player1: m.player1 ? { ...m.player1, isClubAthlete: clubPlayerIds.includes(m.player1.id) } : m.player1,
    player2: m.player2 ? { ...m.player2, isClubAthlete: clubPlayerIds.includes(m.player2.id) } : m.player2,
    isDesignatedAnnotator: Boolean(
      m.isOfficialClubAnnotation ||
      (m.sourceMatch?.assignedCoachId && m.createdByUserId === m.sourceMatch.assignedCoachId),
    ),
  }));
}

export async function loadGestorMatchesData(ctId: string) {
  const [memberships, playerCts] = await Promise.all([
    prisma.membership.findMany({ where: { ctId, status: 'ACTIVE' }, select: { userId: true } }),
    prisma.playerCT.findMany({
      where: { ctId, status: 'ACTIVE' },
      select: { playerId: true, player: { select: { userId: true } } },
    }),
  ]);

  const clubUserIds = Array.from(new Set([
    ...memberships.map((m) => m.userId),
    ...(playerCts.map((p) => p.player.userId).filter(Boolean) as string[]),
  ]));
  const clubPlayerIds = playerCts.map((p) => p.playerId);

  const [items, externalItems] = await Promise.all([
    queryClubMatches(ctId, clubUserIds, clubPlayerIds),
    loadGestorExternalScheduledMatches(ctId, clubUserIds, clubPlayerIds),
  ]);

  return { items, externalItems };
}

export async function loadGestorClubMatches(ctId: string) {
  const data = await loadGestorMatchesData(ctId);
  return data.items;
}
