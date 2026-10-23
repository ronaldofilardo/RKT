import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { updateMatch } from '@/services/matchService';

/**
 * PUT /api/matches/[id] — confere autoria, extrai `version` do body (controle
 * otimista) e delega para `updateMatch`. Mapeia VERSION_CONFLICT → 409.
 */
export async function handleMatchPut(
  request: NextRequest,
  currentUserId: string,
  id: string,
): Promise<NextResponse> {
  try {
    const match = await prisma.match.findFirst({
      where: { id },
      select: { createdByUserId: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    if (match.createdByUserId !== currentUserId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o anotador criador pode editar sua partida' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { version, ...data } = body;
    const expectedVersion = typeof version === 'number' ? version : undefined;
    const updated = await updateMatch(id, data, expectedVersion);

    if (!updated) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    if ('error' in updated) {
      if (updated.error === 'VERSION_CONFLICT') {
        return NextResponse.json(
          { error: 'VERSION_CONFLICT', message: 'A partida foi atualizada simultaneamente por outro usuário.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: updated.error }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('[MATCH PUT]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
