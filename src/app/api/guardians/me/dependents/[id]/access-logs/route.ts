import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: playerId } = await params;
    const link = await prisma.guardianLink.findFirst({
      where: { guardianUserId: auth.id, playerId, status: 'ACTIVE', revokedAt: null },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            userId: true,
            user: { select: { id: true, email: true, mustChangePassword: true, createdAt: true } },
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem tutela ativa sobre o menor.' }, { status: 403 });
    }

    const minorUser = link.player.user;
    if (!minorUser) {
      return NextResponse.json({
        account: { hasAccount: false, email: null, mustChangePassword: true, createdAt: null },
        logs: [],
      });
    }

    const rawLogs = await prisma.auditLog.findMany({
      where: {
        actorUserId: minorUser.id,
        action: { in: ['USER_LOGIN', 'USER_LOGOUT', 'ACCOUNT_ACTIVATED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, action: true, createdAt: true, meta: true },
    });

    const logs = rawLogs.map((l) => ({
      id: l.id,
      action: l.action,
      createdAt: l.createdAt.toISOString(),
      userAgent: (l.meta as Record<string, any>)?.userAgent ?? 'Aplicativo RKT',
    }));

    return NextResponse.json({
      account: {
        hasAccount: true,
        email: minorUser.email,
        mustChangePassword: minorUser.mustChangePassword,
        createdAt: minorUser.createdAt.toISOString(),
      },
      logs,
    });
  } catch (error) {
    logger.error('[GUARDIAN ACCESS LOGS GET]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
