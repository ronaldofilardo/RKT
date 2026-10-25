import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';

import { getMatch, findAbandonedSessionSnapshot } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import { buildReportIntegrity } from './report.integrity';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import { buildReportSummary } from './report-summary.logic';
import { buildReportResponse } from './report-payload.logic';
import { checkReportAccess } from './report-access.logic';
import { loadReportTimeline } from './report-timeline-build.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;

      const user = getRLSUser();
      const match = await getMatch(id);

      const accessError = checkReportAccess(user, match);
      if (accessError) {
        return accessError;
      }
      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      const engineConfig = buildEngineConfig(match);
      const { pointLogs, scoreEdits, timelinePoints } = await loadReportTimeline(id, engineConfig);

      // Snapshot "atual" devolvido no payload (usado pelo cliente para
      // continuar a anotação, se a partida ainda não tiver terminado).
      let responseScoreState: unknown = match.scoreState ?? null;
      if (!responseScoreState) {
        const abandonedSession = await findAbandonedSessionSnapshot(id);
        if (abandonedSession?.matchStateSnapshot) {
          try {
            responseScoreState = JSON.parse(abandonedSession.matchStateSnapshot);
          } catch {
            responseScoreState = null;
          }
        }
      }

      const summary = buildReportSummary(timelinePoints);
      const integrity = buildReportIntegrity(pointLogs, timelinePoints);
      const advancedStats = computeAdvancedStats(timelinePoints, match.format as any);

      const comments = await prisma.matchComment.findMany({
        where: { matchId: id, deletedAt: null },
        select: {
          id: true,
          content: true,
          category: true,
          author: { select: { name: true } },
          createdAt: true,
          audioNoteDuration: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(buildReportResponse({
        match,
        id,
        responseScoreState,
        timelinePoints,
        comments,
        summary,
        integrity,
        advancedStats,
        scoreEdits,
      }));
    } catch (error) {
      logger.error('[MATCH REPORT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
