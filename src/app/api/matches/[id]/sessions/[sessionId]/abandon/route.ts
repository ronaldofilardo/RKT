import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { executeAbandonSession } from './route.helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withRLSHandler(request, 'COACH', async () => {
    try {
      const { id: matchId, sessionId } = await params;
      return executeAbandonSession(request, matchId, sessionId);
    } catch (error) {
      logger.error('[POST /api/matches/:id/sessions/:sessionId/abandon] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao marcar sessão como abandonada' },
        { status: 500 }
      );
    }
  });
}
