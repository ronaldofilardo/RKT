import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { executeSessionPatch } from './route.operations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withRLSHandler(request, 'COACH', async () => {
    try {
      const { id: matchId, sessionId } = await params;
      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }
      return executeSessionPatch(request, matchId, sessionId, user);
    } catch (error) {
      logger.error('[PATCH /api/matches/:id/sessions/:sessionId] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao atualizar sessão' },
        { status: 500 }
      );
    }
  });
}
