import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { getPlayerById } from '@/services/playerService';
import { putPlayerResponse } from './player-put.logic';
import { deletePlayerResponse } from './player-delete.logic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const player = await getPlayerById(id);
      if (!player) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }
      return NextResponse.json(player);
    } catch (error) {
      logger.error('[PLAYERS GET]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', () => putPlayerResponse(request, { params }));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', () => deletePlayerResponse({ params }));
}
