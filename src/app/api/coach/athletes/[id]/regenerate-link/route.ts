import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { ensureAthleteUserAccount } from '@/services/athlete-provision.logic';
import { issueAthleteFirstAccessLink } from '@/services/athlete-first-access-link.logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token requerido' }, { status: 401 });
    }

    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: { user: true, playerCts: true, coachAthleteLinks: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }

    const coachMemberships = await prisma.membership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      select: { ctId: true },
    });
    const coachCtIds = coachMemberships.map((m) => m.ctId).filter((c): c is string => Boolean(c));
    const sharesCt = player.playerCts.some((pct) => coachCtIds.includes(pct.ctId));
    const isCreator = player.createdByUserId === user.id;
    const hasCoachLink = player.coachAthleteLinks.some((l) => l.coachUserId === user.id && l.status === 'ACTIVE');

    if (!isCreator && !hasCoachLink && !sharesCt) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para este atleta' }, { status: 403 });
    }

    const athleteCtId = player.playerCts[0]?.ctId ?? coachCtIds[0] ?? null;
    let userId = player.userId;
    let userEmail = player.user?.email ?? player.email ?? null;

    if (!userId) {
      const provisioned = await ensureAthleteUserAccount({
        playerId: player.id,
        name: player.name,
        cpf: player.cpf,
        email: player.email,
        birthDate: player.birthDate,
        athleteCode: player.athleteCode,
        ctId: athleteCtId,
      });
      userId = provisioned.userId;
    }

    const { token, expiresAt } = await issueAthleteFirstAccessLink({
      userId,
      userEmail,
      ctId: athleteCtId,
      issuedByUserId: user.id,
    });

    return NextResponse.json({
      message: 'Link de primeiro acesso gerado com sucesso.',
      token,
      expiresAt,
    });
  } catch (error) {
    logger.error('[COACH ATHLETE REGENERATE LINK]', error);
    return reportApiError(error);
  }
}
