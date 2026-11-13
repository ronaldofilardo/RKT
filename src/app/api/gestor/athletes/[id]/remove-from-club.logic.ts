import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import type { RLSUser } from '@/lib/rls-context';

/**
 * Remove o atleta do elenco do clube (PlayerCT).
 * Cadastro (Player) e conta de acesso (User) são preservados.
 */
export async function removeAthleteFromClub(
  ctId: string, user: RLSUser, params: Promise<{ id: string }>,
) {
  try {
    const { id } = await params;

    const playerCT = await prisma.playerCT.findFirst({
      where: { ctId, OR: [{ id }, { playerId: id }, { player: { userId: id } }] },
      include: { player: { select: { id: true, name: true } } },
    });
    if (!playerCT) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Atleta não encontrado no elenco do clube' },
        { status: 404 },
      );
    }

    await prisma.playerCT.delete({ where: { id: playerCT.id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'ATLETA_REMOVIDO_ELENCO',
        resourceType: 'PlayerCT',
        resourceId: playerCT.id,
        ctId,
        meta: { playerId: playerCT.player.id, name: playerCT.player.name },
      },
    });

    return NextResponse.json(
      { removed: true, playerId: playerCT.player.id },
      { status: 200 },
    );
  } catch (error) {
    logger.error('[GESTOR ATHLETE REMOVE]', error);
    return reportApiError(error);
  }
}
