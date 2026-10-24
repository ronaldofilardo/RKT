import { prisma } from '@/lib/prisma';

/**
 * Deriva a sequência ativa após a última edição de score (editSeq) a partir
 * do snapshot gravado em `newScoreEdit.newScoreState`.
 */
function editSequenceOf(lastScoreEdit: { newScoreState: unknown } | null): number {
  if (
    lastScoreEdit &&
    typeof lastScoreEdit.newScoreState === 'object' &&
    lastScoreEdit.newScoreState !== null &&
    'pointLogSequenceAtEdit' in (lastScoreEdit.newScoreState as Record<string, unknown>)
  ) {
    return (lastScoreEdit.newScoreState as Record<string, unknown>).pointLogSequenceAtEdit as number;
  }
  return 0;
}

/**
 * Busca os extras do GET /api/matches/[id]: sequência atual, vencedores
 * recentes, última edição de score e logs ativos desde essa edição.
 */
export async function fetchMatchPointExtras(matchId: string) {
  const maxSequenceRow = prisma.pointLog
    ? await prisma.pointLog.aggregate({
        where: { matchId, voidedAt: null, sequenceNumber: { not: null } },
        _max: { sequenceNumber: true },
      })
    : null;
  const lastPointSequence = maxSequenceRow?._max?.sequenceNumber ?? 0;

  const recentLogs = prisma.pointLog
    ? await prisma.pointLog.findMany({
        where: { matchId, voidedAt: null },
        orderBy: { sequenceNumber: 'desc' },
        take: 20,
        select: { winnerId: true },
      })
    : [];
  const recentWinnerIds = recentLogs.reverse().map((l) => l.winnerId);

  const lastScoreEdit = prisma.matchScoreEdit
    ? await prisma.matchScoreEdit.findFirst({
        where: { matchId },
        orderBy: { editedAt: 'desc' },
        select: {
          id: true,
          editedAt: true,
          newScoreState: true,
        },
      })
    : null;

  const editSeq = editSequenceOf(lastScoreEdit);

  const activeLogsSinceEdit = prisma.pointLog
    ? await prisma.pointLog.findMany({
        where: {
          matchId,
          voidedAt: null,
          ...(editSeq > 0 ? { sequenceNumber: { gt: editSeq } } : {}),
        },
        orderBy: { sequenceNumber: 'asc' },
        select: {
          id: true,
          winnerId: true,
          serverId: true,
          type: true,
          sequenceNumber: true,
          annotations: true,
          timestamp: true,
        },
      })
    : [];

  return { lastPointSequence, recentWinnerIds, lastScoreEdit, activeLogsSinceEdit };
}
