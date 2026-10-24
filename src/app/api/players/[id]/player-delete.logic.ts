import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getRLSUser } from '@/lib/auth';
import { getPlayerById, deletePlayer, countPlayerActiveMatches } from '@/services/playerService';

export async function deletePlayerResponse(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await getPlayerById(id);
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }

    const user = getRLSUser();
    const isStaff = user?.role === 'ADMIN';
    const isCreator = existing.createdByUserId && user?.id === existing.createdByUserId;

    if (!isStaff && !isCreator) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Sem permissão para excluir este atleta' },
        { status: 403 }
      );
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
}
