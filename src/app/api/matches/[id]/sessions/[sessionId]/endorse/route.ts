import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/auth';
import { getSessionWithMatch, createEndorsement } from '@/services/sessionService';

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

    if (session.isActive) {
      return NextResponse.json(
        { error: 'CANNOT_ENDORSE_ACTIVE_SESSION', message: 'Cannot endorse an active session' },
        { status: 400 }
      );
    }

    if (session.annotatorUserId === user.id) {
      return NextResponse.json(
        { error: 'SELF_ENDORSEMENT', message: 'Annotator cannot endorse their own session' },
        { status: 409 }
      );
    }

    const endorsement = await createEndorsement(sessionId, user.id);
    return NextResponse.json(endorsement, { status: 201 });
  } catch (error) {
    console.error('[POST /api/matches/:id/sessions/:sessionId/endorse] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao endossar sessão' },
      { status: 500 }
    );
  }
}