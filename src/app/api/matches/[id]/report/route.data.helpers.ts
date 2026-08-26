import type { TimelinePoint } from '@/core/scoring/types';
import { rebuildTimelineFromPointLogs, type PointLogRow } from '@/components/scoring/timeline-rebuild';
import { findAbandonedSessionSnapshot, getMatch } from '@/services/matchService';
import type { TennisFormat } from '@/core/scoring/types';
import { prisma } from '@/lib/prisma';

export async function buildReportTimeline(
  matchId: string,
  player1Id: string,
  player2Id: string,
  initialServerId: string,
  format: TennisFormat,
): Promise<{ pointLogs: PointLogRow[]; timelinePoints: TimelinePoint[] }> {
  const pointLogs = await prisma.pointLog.findMany({
    where: { matchId },
    orderBy: [{ sequenceNumber: 'asc' }, { timestamp: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      winnerId: true,
      type: true,
      serverId: true,
      sequenceNumber: true,
      clientEventId: true,
      timestamp: true,
      annotations: true,
      audioNote: true,
      audioNoteMime: true,
      audioNoteDuration: true,
    },
  }) as PointLogRow[];
  const timelinePoints = rebuildTimelineFromPointLogs(
    [], pointLogs, player1Id, player2Id, initialServerId, format,
  );
  return { pointLogs, timelinePoints };
}

type ReportMatch = NonNullable<Awaited<ReturnType<typeof getMatch>>>;

export async function getReportScoreState(match: ReportMatch, matchId: string): Promise<unknown> {
  if (match.scoreState) return match.scoreState;
  const abandonedSession = await findAbandonedSessionSnapshot(matchId);
  if (!abandonedSession?.matchStateSnapshot) return null;
  try {
    return JSON.parse(abandonedSession.matchStateSnapshot);
  } catch {
    return null;
  }
}
