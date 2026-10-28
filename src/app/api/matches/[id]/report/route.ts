import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withAccessHandler } from '@/lib/access-handler';

import { getMatch, findAbandonedSessionSnapshot } from '@/services/matchService';
import { canReadMatchComments } from '@/core/access';
import { getMatchAccess } from '@/services/match-access-service';
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
  return withAccessHandler(request, 'report:view', null, async ({ actor }) => {
    try {
      const { id } = await params;
      const match = await getMatch(id);
      const matchAccess = match ? await getMatchAccess(id, match) : null;

      const accessError = checkReportAccess(actor, match, matchAccess);
      if (accessError) {
        return accessError;
      }
      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }
      if (!matchAccess) {
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

      const canViewComments = canReadMatchComments(actor, matchAccess);
      const comments = canViewComments
        ? await prisma.matchComment.findMany({
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
          })
        : [];
      const visibleTimeline = canViewComments
        ? timelinePoints
        : timelinePoints.map(({ note: _note, hasAudioNote: _hasAudioNote, audioNoteMime: _audioNoteMime, audioNoteDuration: _audioNoteDuration, ...point }) => point);
      if (!canViewComments) responseScoreState = null;

      return NextResponse.json(buildReportResponse({
        match,
        id,
        responseScoreState,
        timelinePoints: visibleTimeline,
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
