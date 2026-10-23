import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { deleteMatch } from '@/services/matchService';
import { DeleteMatchInputSchema } from '@/schemas/contracts';

/**
 * DELETE /api/matches/[id] — valida payload, confere a autoria e delega para
 * `deleteMatch` (soft/hard). Erro de handler vira 500 com log.
 */
export async function handleMatchDelete(
  request: NextRequest,
  currentUserId: string,
  id: string,
): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'soft';
    const reason = searchParams.get('reason') || undefined;

    const parsed = DeleteMatchInputSchema.safeParse({ type, reason });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const match = await prisma.match.findFirst({
      where: { id },
      select: { createdByUserId: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    if (match.createdByUserId !== currentUserId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o anotador criador pode excluir sua partida' },
        { status: 403 }
      );
    }

    const result = await deleteMatch(id, {
      type: parsed.data.type,
      reason: parsed.data.reason,
      deletedBy: currentUserId,
    });

    if ('error' in result) {
      const status = result.error === 'MATCH_NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[MATCH DELETE]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
