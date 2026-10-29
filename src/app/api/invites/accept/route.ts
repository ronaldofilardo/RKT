import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const AcceptSchema = z.object({
  token: z.string().min(10),
  code: z.string().min(4).optional(),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'athlete:create', null, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = AcceptSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }
      const { token, code } = parsed.data;
      const targetUserId = user.id;

      const tokenHash = createHash('sha256').update(token).digest('hex');
      const invite = await prisma.linkInvite.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      });
      if (!invite) {
        return NextResponse.json({ error: 'INVALID_INVITE', message: 'Convite inválido ou expirado' }, { status: 400 });
      }

      if (code) {
        const codeHash = createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
        if (codeHash !== invite.codeHash) {
          return NextResponse.json({ error: 'INVALID_CODE', message: 'Código de validação incorreto' }, { status: 400 });
        }
      }

      if (invite.kind === 'ATLETA') {
        const player = await prisma.player.findFirst({ where: { userId: targetUserId } });
        if (!player) {
          return NextResponse.json({ error: 'PLAYER_NOT_FOUND', message: 'Usuário não possui perfil de atleta' }, { status: 400 });
        }
        await prisma.$transaction([
          prisma.playerCT.create({
            data: { playerId: player.id, ctId: invite.ctId, status: 'ACTIVE' },
          }),
          prisma.linkInvite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
          }),
        ]);
        await prisma.user.update({ where: { id: targetUserId }, data: { canOperate: true } });
        return NextResponse.json({ message: 'Vínculo de atleta aceito com sucesso.' }, { status: 200 });
      }

      const membershipKind = invite.kind === 'TREINADOR' ? 'TREINADOR' : 'GESTOR';
      await prisma.$transaction([
        prisma.membership.create({
          data: {
            userId: targetUserId,
            kind: membershipKind,
            ctId: invite.ctId ?? undefined,
            status: 'ACTIVE',
          },
        }),
        prisma.linkInvite.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        }),
      ]);
      await prisma.user.update({ where: { id: targetUserId }, data: { canOperate: true } });
      return NextResponse.json({ message: 'Vínculo aceito com sucesso.' }, { status: 200 });
    } catch (error) {
      logger.error('[INVITE ACCEPT POST]', error);
      return reportApiError(error);
    }
  });
}
