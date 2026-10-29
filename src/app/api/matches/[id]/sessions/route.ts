import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { listSessions } from '@/services/sessionService';
import { logger } from '@/lib/logger';
import { postSessionResponse } from './session-post.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async () => {
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
  return withAccessHandler(request, null, null, async ({ user }) => {
    return postSessionResponse(request, { params }, user);
  });
}
