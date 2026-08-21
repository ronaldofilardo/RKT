import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { listSessions, checkMatchExists, getUserSessions, reactivateOrCreateSession } from '@/services/sessionService';
import { logger } from '@/lib/logger';
import { getSessionResponse, getSuspendedResponse } from './session-route.helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    try {
      const { id: matchId } = await params;
      return NextResponse.json(await listSessions(matchId));
    } catch (error) {
      logger.error('[GET /api/matches/:id/sessions] Error:', error);
      return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar sessões' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id: matchId } = await params;
      const user = getRLSUser();
      if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      const match = await checkMatchExists(matchId);
      if (!match) return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      if (match.state === 'FINISHED') return NextResponse.json({ error: 'MATCH_ALREADY_FINISHED' }, { status: 409 });

      const body = await request.json().catch(() => ({}));
      const allSessions = await getUserSessions(matchId, user.id);
      const isAutoResume = body.autoStarted === true && allSessions.length > 0 && allSessions[0].isActive === false;
      if (isAutoResume) return NextResponse.json(getSuspendedResponse(allSessions[0], match));

      const isNew = allSessions.length === 0;
      const session = await reactivateOrCreateSession(matchId, user.id, allSessions);
      const response = getSessionResponse(session, allSessions[0], match, isNew);
      return NextResponse.json(response.body, { status: response.status });
    } catch (error) {
      logger.error('[POST /api/matches/:id/sessions] Error:', error);
      return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao iniciar sessão' }, { status: 500 });
    }
  });
}
