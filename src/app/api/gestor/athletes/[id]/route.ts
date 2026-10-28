import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../_logic';
import { PatchSchema } from './patch-logic';

export async function PATCH(
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
        const body = await request.json().catch(() => null);
        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const playerCT = await prisma.playerCT.findFirst({
          where: { OR: [{ id }, { playerId: id }, { player: { userId: id } }], ctId },
          include: { player: { include: { user: true } } },
        });
        if (!playerCT || !playerCT.player.user) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Atleta não encontrado' },
            { status: 404 },
          );
        }

        const userId = playerCT.player.userId;
        if (!userId) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Usuário do atleta não encontrado' },
            { status: 404 },
          );
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            name: parsed.data.name,
            cpf: parsed.data.cpf.replace(/\D/g, ''),
          },
        });

        await prisma.player.update({
          where: { id: playerCT.player.id },
          data: {
            name: parsed.data.name,
            gender: parsed.data.gender,
            dominance: parsed.data.dominance,
            birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
          },
        });

        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            action: 'ATLETA_DADOS_ATUALIZADOS',
            resourceType: 'Player',
            resourceId: playerCT.player.id,
            ctId,
            meta: { name: parsed.data.name, cpf: parsed.data.cpf, gender: parsed.data.gender },
          },
        });

        return NextResponse.json({ ok: true }, { status: 200 });
      } catch (error) {
        logger.error('[ATHLETE PATCH]', error);
        return reportApiError(error);
      }
    },
  );
}
