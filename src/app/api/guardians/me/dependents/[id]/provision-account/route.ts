import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cleanCpf } from '@/core/athlete/cpf';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { id: playerId } = await params;
    const link = await prisma.guardianLink.findFirst({
      where: { guardianUserId: auth.id, playerId, status: 'ACTIVE', revokedAt: null },
      include: { player: true },
    });
    if (!link) return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem tutela ativa.' }, { status: 403 });
    if (link.player.userId) {
      return NextResponse.json({ error: 'ACCOUNT_ALREADY_EXISTS', message: 'Conta já habilitada.' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const clean = cleanCpf(link.player.cpf ?? '');
    const email = body?.email?.trim().toLowerCase() || (clean ? `${clean}@rkt.local` : `atleta_${playerId.slice(0, 8)}@rkt.local`);
    const tempPassword = Math.floor(10000000 + Math.random() * 90000000).toString();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: link.player.name,
          email,
          cpf: link.player.cpf ?? `DEP_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          passwordHash,
          mustChangePassword: true,
          role: 'ANNOTATOR',
          canOperate: true,
        },
      });

      await tx.player.update({
        where: { id: playerId },
        data: { userId: user.id, email, identityStatus: 'CONFIRMED' },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: auth.id,
          action: 'ACCOUNT_ACTIVATED_BY_GUARDIAN',
          resourceType: 'User',
          resourceId: user.id,
          meta: { playerId, dependentName: link.player.name, law: 'ECA Digital 15.211/2025' },
        },
      });

      return { user, tempPassword };
    });

    return NextResponse.json({
      success: true,
      identifier: result.user.email,
      tempPassword: result.tempPassword,
      playerName: link.player.name,
    });
  } catch (err) {
    logger.error('[PROVISION ACCOUNT]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
