import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler, withPermissionHandler } from '@/lib/auth';
import { listSessions } from '@/services/sessionService';
import { logger } from '@/lib/logger';
import { postSessionResponse } from './session-post.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id: matchId } = await params;
      const sessions = await listSessions(matchId);
      return NextResponse.json(sessions);
    } catch (error) {
      logger.error('[GET /api/matches/:id/sessions] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar sessões' },
        { status: 500 }
      );
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionHandler(request, 'annotate:session', (user) =>
    postSessionResponse(request, { params }, user)
  );
}
