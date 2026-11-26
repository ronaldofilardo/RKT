import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { withRLSHandler } from '@/lib/auth';
import { EndSessionInputSchema } from '@/schemas/contracts';
import { getSessionWithMatch, getMatchScoreState, updateSession } from '@/services/sessionService';
import { logger } from '@/lib/logger';
import { buildEndSessionUpdate } from './session-end-update.logic';

const ParamsSchema = z.object({
  id: flexibleIdValidator,
  sessionId: flexibleIdValidator,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id: matchId, sessionId } = parsedParams.data;

  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
    try {
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
      const updateData = buildEndSessionUpdate(newStatus, parsed.data.finalState, match?.scoreState);
      const updated = await updateSession(sessionId, updateData);
      return NextResponse.json(updated);
    } catch (error) {
      logger.error('[PATCH /api/matches/:id/sessions/:sessionId] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao atualizar sessão' },
        { status: 500 }
      );
    }
  });
}
