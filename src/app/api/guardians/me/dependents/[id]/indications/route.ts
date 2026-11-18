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
    if (!auth?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { id: playerId } = await params;
    const link = await prisma.guardianLink.findFirst({
      where: { guardianUserId: auth.id, playerId, status: 'ACTIVE', revokedAt: null },
      select: { id: true },
    });
    if (!link) return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem tutela ativa.' }, { status: 403 });

    const [playerCts, coachLinks, invites] = await Promise.all([
      prisma.playerCT.findMany({
        where: { playerId },
        include: { ct: { select: { id: true, name: true } } },
        orderBy: { since: 'desc' },
      }),
      prisma.coachAthleteLink.findMany({
        where: { playerId },
        include: { coach: { select: { id: true, name: true, email: true } } },
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.coachInvitationToken.findMany({
        where: { guardianUserId: auth.id, playerId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      trainingCenters: playerCts.map((pct) => ({
        id: pct.id,
        ctId: pct.ctId,
        name: pct.ct?.name ?? 'Centro de Treinamento',
        status: pct.status,
        since: pct.since.toISOString(),
        endedAt: pct.endedAt?.toISOString() ?? null,
      })),
      coaches: coachLinks.map((cl) => ({
        id: cl.id,
        coachUserId: cl.coachUserId,
        name: cl.coach.name,
        status: cl.status,
        requestedAt: cl.requestedAt.toISOString(),
        respondedAt: cl.respondedAt?.toISOString() ?? null,
      })),
      invites: invites.map((inv) => ({
        id: inv.id,
        coachName: inv.coachName,
        coachPhone: inv.coachPhone,
        expiresAt: inv.expiresAt.toISOString(),
        usedAt: inv.usedAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('[GUARDIAN INDICATIONS GET]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
