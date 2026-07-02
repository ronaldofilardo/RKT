import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/auth';
import { MarkSessionAbandonedInputSchema } from '@/schemas/contracts';
import { getSessionWithMatch, getMatchScoreState, updateSession } from '@/services/sessionService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const roleCheck = await requireRole(request, 'COACH');
  if (roleCheck) return roleCheck;

  try {
    const { id: matchId, sessionId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const session = await getSessionWithMatch(sessionId, matchId);

    if (!session || session.matchId !== matchId) {
      return NextResponse.json(
        { error: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (session.annotatorUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only the annotator or admin can abandon a session' },
        { status: 403 }
      );
    }

    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      return NextResponse.json({
        message: 'Session already ended',
        id: session.id,
        status: session.status,
      });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = MarkSessionAbandonedInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const match = await getMatchScoreState(matchId);

    let matchStateSnapshot = parsed.data.matchStateSnapshot;

    if (!matchStateSnapshot && match?.scoreState) {
      matchStateSnapshot = typeof match.scoreState === 'string'
        ? match.scoreState
        : JSON.stringify(match.scoreState);
    }

    const updated = await updateSession(sessionId, {
      status: 'ABANDONED',
      isActive: false,
      matchStateSnapshot: matchStateSnapshot ?? null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[POST /api/matches/:id/sessions/:sessionId/abandon] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao marcar sessão como abandonada' },
      { status: 500 }
    );
  }
}