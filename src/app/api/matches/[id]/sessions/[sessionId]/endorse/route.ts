import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withAccessHandler } from '@/lib/access-handler';
import { getSessionWithMatch, createEndorsement } from '@/services/sessionService';
import { SessionPathParamsSchema } from '@/schemas/comment';
import { ZodError } from 'zod';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    try {
      const { id: matchId, sessionId } = SessionPathParamsSchema.parse(await params);
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
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'INVALID_PARAMS', message: 'Parâmetros de sessão inválidos' },
          { status: 400 }
        );
      }
      logger.error('[POST /api/matches/:id/sessions/:sessionId/endorse] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao endossar sessão' },
        { status: 500 }
      );
    }
  });
}
