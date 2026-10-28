import type { MatchAccess } from '@/core/access';
import { prisma } from '@/lib/prisma';

export async function getMatchAccess(
  matchId: string,
  fallbackMatch?: any,
): Promise<MatchAccess | null> {
  const buildFallback = (): MatchAccess | null => {
    if (!fallbackMatch) return null;
    return {
      createdByUserId: fallbackMatch.createdByUserId ?? null,
      ctId: fallbackMatch.ctId ?? null,
      annotatorUserIds: [],
      participantPlayerIds: [
        fallbackMatch.player1Id ?? fallbackMatch.player1?.id,
        fallbackMatch.player2Id ?? fallbackMatch.player2?.id,
        fallbackMatch.player1PartnerId ?? fallbackMatch.player1Partner?.id,
        fallbackMatch.player2PartnerId ?? fallbackMatch.player2Partner?.id,
      ].filter(Boolean),
      participantCtIds: fallbackMatch.ctId ? [fallbackMatch.ctId] : [],
    };
  };

  if (!prisma?.match?.findFirst) return buildFallback();
  try {
    const row = await prisma.match.findFirst({
      where: { id: matchId, deletedAt: null },
      select: {
        createdByUserId: true,
        ctId: true,
        player1Id: true,
        player2Id: true,
        player1PartnerId: true,
        player2PartnerId: true,
        annotationSessions: { select: { annotatorUserId: true } },
        player1: { select: { playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true } } } },
        player2: { select: { playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true } } } },
        player1Partner: { select: { playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true } } } },
        player2Partner: { select: { playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true } } } },
      },
    });
    if (!row) return buildFallback();

    return {
      createdByUserId: row.createdByUserId,
      ctId: row.ctId,
      annotatorUserIds: row.annotationSessions.map(({ annotatorUserId }) => annotatorUserId),
      participantPlayerIds: [
        row.player1Id, row.player2Id, row.player1PartnerId, row.player2PartnerId,
      ].filter((playerId): playerId is string => !!playerId),
      participantCtIds: [
        ...row.player1.playerCts,
        ...row.player2.playerCts,
        ...(row.player1Partner?.playerCts ?? []),
        ...(row.player2Partner?.playerCts ?? []),
      ].map(({ ctId }) => ctId),
    };
  } catch {
    return buildFallback();
  }
}
