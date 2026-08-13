import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';
import { ScoringEngine } from '@/core/scoring/engine';
import type { TimelinePoint } from '@/core/scoring/types';
import { enrichPointsFromHistory } from '@/components/scoring/timeline-utils';
import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '@/components/scoring/timeline-rebuild';
import { getMatch, findAbandonedSessionSnapshot } from '@/services/matchService';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id } = await params;

      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      const isStaff = (['ADMIN', 'GESTOR', 'COACH'] as Role[]).includes(user.role as Role);

      const match = await getMatch(id);

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      const isPlayer = match.player1.id === user.id || match.player2.id === user.id;
      const isCreator = match.createdByUserId === user.id;
      if (!isPlayer && !isCreator && !isStaff) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }

      let timelinePoints: TimelinePoint[] = [];
      let scoreState = match.scoreState ?? null;

      if (scoreState) {
        try {
          const engine = ScoringEngine.fromSerialized(
            {
              format: match.format as any,
              player1Id: match.player1.id,
              player2Id: match.player2.id,
              initialServerId: match.initialServerId ?? match.player1.id,
            },
            JSON.stringify(scoreState)
          );

          const history = engine.getPointHistory();
          timelinePoints = enrichPointsFromHistory(
            history,
            match.player1.id,
            match.player2.id
          );
        } catch {
          scoreState = null;
        }
      }

      if (!scoreState) {
        const abandonedSession = await findAbandonedSessionSnapshot(id);

        if (abandonedSession?.matchStateSnapshot) {
          try {
            const parsedSnapshot = JSON.parse(abandonedSession.matchStateSnapshot);
            scoreState = parsedSnapshot;

            const engine = ScoringEngine.fromSerialized(
              {
                format: match.format as any,
                player1Id: match.player1.id,
                player2Id: match.player2.id,
                initialServerId: match.initialServerId ?? match.player1.id,
              },
              abandonedSession.matchStateSnapshot
            );

            const history = engine.getPointHistory();
            timelinePoints = enrichPointsFromHistory(
              history,
              match.player1.id,
              match.player2.id
            );
          } catch {
            // Failed to parse snapshot, keep empty timeline
          }
        }
      }

      // Os `PointLog` são a fonte imutável e completa das anotações
      // (rallyDetails, firstFault, áudio, etc.). Em cenários reais —
      // principalmente após undo/redo/sync que descartaram entradas do
      // `scoreState.history` — o history pode estar incompleto mesmo
      // quando há N PointLog. Por isso buscamos TODOS os PointLog (com
      // annotations) e os usamos como base de verdade, mesclando com o
      // stateBefore do history quando disponível.
      const pointLogs = await prisma.pointLog.findMany({
        where: { matchId: id },
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          winnerId: true,
          type: true,
          serverId: true,
          timestamp: true,
          annotations: true,
          audioNote: true,
          audioNoteDuration: true,
        },
      }) as PointLogRow[];

      if (pointLogs.length > 0) {
        const initialServerId = match.initialServerId ?? match.player1.id;
        timelinePoints = rebuildTimelineFromPointLogs(
          timelinePoints,
          pointLogs,
          match.player1.id,
          match.player2.id,
          initialServerId,
        );
      }

      return NextResponse.json({
        matchId: id,
        player1: { id: match.player1.id, name: match.player1.name },
        player2: { id: match.player2.id, name: match.player2.name },
        format: match.format,
        scoreState,
        timelinePoints,
        state: match.state,
        startedAt: match.startedAt,
        finishedAt: match.finishedAt,
      });
    } catch (error) {
      logger.error('[MATCH REPORT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
