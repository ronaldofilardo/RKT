import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const AcceptSchema = z.object({
  token: z.string().min(10),
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AcceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const { token, userId } = parsed.data;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invite = await prisma.linkInvite.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!invite) {
      return NextResponse.json({ error: 'INVALID_INVITE' }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.membership.create({
        data: {
          userId,
          kind: invite.kind === 'TREINADOR' ? 'TREINADOR' : 'GESTOR',
          ctId: invite.ctId ?? undefined,
          status: 'ACTIVE',
        },
      }),
      prisma.linkInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);
    await prisma.user.update({ where: { id: userId }, data: { canOperate: true } });
    return NextResponse.json({ message: 'Vínculo aceito.' }, { status: 200 });
  } catch (error) {
    logger.error('[INVITE ACCEPT POST]', error);
    return reportApiError(error);
  }
}
