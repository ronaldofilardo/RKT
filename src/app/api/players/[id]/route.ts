import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { getPlayerById, updatePlayer, deletePlayer, countPlayerActiveMatches } from '@/services/playerService';
import {
  buildPlayerUpdateData,
  validatePlayerUpdate,
} from './player-update.helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
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
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const existing = await getPlayerById(id);
      if (!existing) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }

      const validationError = validatePlayerUpdate(body);
      if (validationError) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: validationError },
          { status: 400 }
        );
      }

      const updated = await updatePlayer(
        id,
        buildPlayerUpdateData(body) as Parameters<typeof updatePlayer>[1]
      );
      return NextResponse.json(updated);
    } catch (error) {
      logger.error('[PLAYERS PUT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id } = await params;

      const existing = await getPlayerById(id);
      if (!existing) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }

      const matches = await countPlayerActiveMatches(id);
      const blocking = matches.filter((m) => m.count > 0);
      if (blocking.length > 0) {
        return NextResponse.json(
          {
            error: 'PLAYER_HAS_MATCHES',
            message: 'Atleta possui partidas agendadas, em andamento ou finalizadas. Exclua ou encerre essas partidas antes de excluir o atleta.',
            matches,
          },
          { status: 409 }
        );
      }

      const deleted = await deletePlayer(id);
      return NextResponse.json({ id: deleted.id, deleted: true });
    } catch (error) {
      logger.error('[PLAYERS DELETE]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
