import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/auth';
import { EndSessionInputSchema } from '@/schemas/contracts';
import { getSessionWithMatch, getMatchScoreState, updateSession } from '@/services/sessionService';

export async function PATCH(
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
        { error: 'FORBIDDEN', message: 'Only the annotator or admin can end a session' },
        { status: 403 }
      );
    }

    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      return NextResponse.json({
        id: session.id,
        status: session.status,
        alreadyEnded: true,
      });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = EndSessionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.status || 'COMPLETED';

    if (!['COMPLETED', 'ABANDONED', 'IN_PROGRESS'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const match = await getMatchScoreState(matchId);

    const serializeState = (state: unknown): string | null => {
      if (!state) return null;
      return typeof state === 'string' ? state : JSON.stringify(state);
    };

    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === 'IN_PROGRESS') {
      updateData.isActive = true;
    }

    if (newStatus === 'ABANDONED') {
      updateData.isActive = false;
      updateData.matchStateSnapshot = serializeState(parsed.data.finalState || match?.scoreState);
    }

    if (newStatus === 'COMPLETED') {
      updateData.isActive = false;
      updateData.endedAt = new Date();
      updateData.finalStateSnapshot = serializeState(parsed.data.finalState || match?.scoreState);
    }

    const updated = await updateSession(sessionId, updateData as any);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/matches/:id/sessions/:sessionId] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao atualizar sessão' },
      { status: 500 }
    );
  }
}