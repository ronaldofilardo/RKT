import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';
import { ScoringEngine } from '@/core/scoring/engine';
import type { TimelinePoint } from '@/core/scoring/types';
import { enrichPointsFromHistory } from '@/components/scoring/timeline-utils';
import { getMatch, findAbandonedSessionSnapshot } from '@/services/matchService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const isStaff = (['ADMIN', 'GESTOR', 'COACH'] as Role[]).includes(user.role);

    const match = await getMatch(id);

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    const isPlayer = match.player1.id === user.id || match.player2.id === user.id;
    if (!isPlayer && !isStaff) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    let timelinePoints: TimelinePoint[] = [];
    let scoreState = match.scoreState ?? null;

    if (scoreState) {
      try {
        const engine = ScoringEngine.fromSerialized(
          {
            format: match.format,
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
              format: match.format,
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
    console.error('[MATCH REPORT]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}