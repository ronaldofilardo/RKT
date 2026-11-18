import { prisma } from '@/lib/prisma';
import { resolveCreatorRoleLabel } from '@/app/gestor/gestor-match-display.logic';
import { GESTOR_EXTERNAL_MATCH_SELECT } from './gestor-external-matches-select';

export async function loadGestorExternalScheduledMatches(
  ctId: string,
  clubUserIds: string[],
  clubPlayerIds: string[],
) {
  if (clubPlayerIds.length === 0) return [];

  const rows = await prisma.match.findMany({
    where: {
      deletedAt: null,
      sourceMatchId: null,
      OR: [
        { player1Id: { in: clubPlayerIds } },
        { player2Id: { in: clubPlayerIds } },
        { player1PartnerId: { in: clubPlayerIds } },
        { player2PartnerId: { in: clubPlayerIds } },
      ],
      AND: [
        { OR: [{ ctId: null }, { ctId: { not: ctId } }] },
        ...(clubUserIds.length > 0 ? [{ createdByUserId: { notIn: clubUserIds } }] : []),
      ],
    },
    select: GESTOR_EXTERNAL_MATCH_SELECT,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map((m: any) => ({
    ...m,
    pointCount: 0,
    isDesignatedAnnotator: false,
    sourceMatch: null,
    creatorRoleLabel: resolveCreatorRoleLabel(m.createdByUser),
    player1: m.player1 ? { ...m.player1, isClubAthlete: clubPlayerIds.includes(m.player1.id) } : m.player1,
    player2: m.player2 ? { ...m.player2, isClubAthlete: clubPlayerIds.includes(m.player2.id) } : m.player2,
    player1Partner: m.player1Partner ? { ...m.player1Partner, isClubAthlete: clubPlayerIds.includes(m.player1Partner.id) } : (m.player1Partner ?? null),
    player2Partner: m.player2Partner ? { ...m.player2Partner, isClubAthlete: clubPlayerIds.includes(m.player2Partner.id) } : (m.player2Partner ?? null),
  }));
}
