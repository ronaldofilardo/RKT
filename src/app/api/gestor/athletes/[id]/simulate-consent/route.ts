import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../../_logic';
import { simulateGuardianConsent } from './simulate-consent.logic';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de atleta inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(
    request,
    'platform:memberships:manage',
    () => ({ ctId }),
    async ({ user }) => {
      try {
        const { id } = await params;
        const playerCt = await prisma.playerCT.findFirst({
          where: { OR: [{ id }, { playerId: id }, { player: { userId: id } }], ctId },
          include: { player: true },
        });

        if (!playerCt) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Vínculo de atleta não encontrado' },
            { status: 404 },
          );
        }

        const result = await simulateGuardianConsent({
          ctId,
          playerId: playerCt.player.id,
          managerUserId: user.id,
        });

        return NextResponse.json({
          message: 'Consentimento do responsável simulado com sucesso.',
          isConsented: result.isConsented,
        });
      } catch (error) {
        logger.error('[SIMULATE GUARDIAN CONSENT]', error);
        return reportApiError(error);
      }
    },
  );
}
