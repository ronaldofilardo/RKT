import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    const claims = await prisma.athleteClaim.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        playerId: true,
        status: true,
        decidedByUserId: true,
        createdAt: true,
        player: { select: { id: true, name: true, cpfHash: true, cpfLast2: true, identityStatus: true } },
      },
    });

    return NextResponse.json({ items: claims }, { status: 200 });
  } catch (error) {
    logger.error('[ATHLETE CLAIMS ME GET]', error);
    return reportApiError(error);
  }
}
