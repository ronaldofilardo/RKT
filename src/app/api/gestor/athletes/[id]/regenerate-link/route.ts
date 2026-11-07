import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../../_logic';
import { provisionAthleteAccount } from '../../../athletes-provision.logic';
import { issueAthleteLink } from './regenerate-link-issue.logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
          include: { player: { include: { user: true } } },
        });
        if (!playerCt) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Vínculo de atleta não encontrado' },
            { status: 404 },
          );
        }

        let userId = playerCt.player.userId;
        let userEmail = playerCt.player.user?.email ?? null;

        // Atleta vinculado ao CT sem conta de acesso (cadastro rápido/PROVISIONAL):
        // cria ou vincula a conta na hora para poder emitir o link de senha.
        if (!userId) {
          const provisioned = await provisionAthleteAccount({
            ctId,
            issuedByUserId: user.id,
            player: playerCt.player,
          });
          if (!provisioned.ok) {
            return NextResponse.json(
              { error: provisioned.error, message: provisioned.message },
              { status: provisioned.status },
            );
          }
          userId = provisioned.userId;
          userEmail = provisioned.email;
        }

        const { token, expiresAt } = await issueAthleteLink({ ctId, userId, userEmail });

        return NextResponse.json({
          message: 'Link de acesso regenerado.',
          token,
          expiresAt,
        });
      } catch (error) {
        logger.error('[ATHLETE REGENERATE LINK]', error);
        return reportApiError(error);
      }
    },
  );
}
